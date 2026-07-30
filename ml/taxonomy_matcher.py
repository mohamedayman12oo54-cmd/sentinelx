"""
Model 2: Taxonomy matcher (retrieval, not classification).

Combines the two real taxonomy files that exist in the project
(ai_agent_core_threats.csv + agent_attack_taxonomy.csv).
master_ai_agent_cybersecurity.csv does NOT exist in the project files
and is intentionally excluded rather than assumed.

Fixes vs. the backend's example response:
1. Events with no free-text `description` field (file_access, network_connection
   using structured fields like path/access_mode/destination/protocol) are
   converted to a synthesized sentence before embedding, instead of being
   unmatchable.
2. A similarity threshold gates the match -- below threshold, the matcher
   returns matched=False instead of forcing a best-guess row. This is what
   was missing when AML.T0053 (Training Data Poisoning) got attached to a
   /etc/shadow file read, and AML.T0048 (LLM Jailbreak) got attached to an
   outbound network connection -- both real IDs, both wrong matches.
"""
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import config

SIMILARITY_THRESHOLD = 0.15  # tuned below against the validation set


def load_taxonomy():
    core = pd.read_csv(config.AI_AGENT_CORE_THREATS_CSV)
    core_rows = core.rename(columns={'mitre_atlas_id': 'mitre_ref'})
    core_rows = core_rows[['attack_name', 'description', 'mitre_ref', 'target_component', 'severity_score']].copy()
    core_rows = core_rows.rename(columns={'attack_name': 'attack_type'})
    core_rows['source_dataset'] = 'ai_agent_core_threats.csv'
    core_rows['severity_score'] = core_rows['severity_score'].astype(float)

    tax = pd.read_csv(config.AGENT_ATTACK_TAXONOMY_CSV)
    tax_rows = tax.rename(columns={'mitre_atlas_ref': 'mitre_ref'})
    tax_rows = tax_rows[['attack_type', 'description', 'mitre_ref', 'target_component']].copy()
    # Explicit float NaN (not None) so this column's dtype matches core_rows'
    # severity_score dtype going into concat -- avoids the pandas FutureWarning
    # about all-NA columns being excluded from dtype inference.
    tax_rows['severity_score'] = np.nan
    tax_rows['source_dataset'] = 'agent_attack_taxonomy.csv'

    # NOTE: tried folding mitre_attack_mapping.csv in as a third source to cover
    # network-exfiltration events (T1048 "Exfiltration Over Alternative Protocol"
    # looked like the right fix). Measured effect: it broke the file_access match
    # that was previously correct (TF-IDF re-weights across the whole corpus, and
    # adding ~17 more short rows shifted which terms count as distinctive).
    # Reverted. This 89-row two-file corpus genuinely has no good row for generic
    # outbound-network-connection events, and TF-IDF similarity alone isn't
    # reliable enough here to widen the corpus without re-validating every
    # existing case. See KNOWN_GAPS below for how this is handled instead.
    combined = pd.concat([core_rows, tax_rows], ignore_index=True)
    return combined


# Known coverage gaps in the taxonomy data, found via validation, not guessed.
# A small rule layer runs first for patterns common enough to name explicitly,
# rather than letting the embedding matcher force a low-confidence guess.
KNOWN_GAPS = {
    'network_connection': (
        "Neither taxonomy CSV has a dedicated row for generic outbound network "
        "connections. mitre_attack_mapping.csv has T1048 (Exfiltration Over "
        "Alternative Protocol) which is conceptually right, but folding it into "
        "the embedding index destabilized other matches (see note above)."
    ),
}

SENSITIVE_PATH_PATTERNS = ('/etc/shadow', '/etc/passwd', '.ssh/', '.aws/credentials', '.env')


TAXONOMY = load_taxonomy()
_vectorizer = TfidfVectorizer(stop_words='english')
_matrix = _vectorizer.fit_transform(TAXONOMY['description'])


def event_to_text(event_type: str, resource: str, operation: str, details: dict) -> str:
    """Synthesize free text from structured event fields.
    This is the piece that was missing once `description` disappeared
    from file_access/network_connection payloads.
    """
    if 'description' in details:
        return details['description']
    if event_type == 'file_access':
        path = details.get('path', resource)
        mode = details.get('access_mode', operation)
        return f"Agent performed {mode} access on sensitive file path {path}"
    if event_type == 'network_connection':
        dest = details.get('destination', resource)
        proto = details.get('protocol', '')
        return f"Agent made outbound {proto} network connection to {dest}"
    if event_type == 'api_call':
        return details.get('llm_input') or details.get('prompt_text') or f"{operation} call to {resource}"
    return f"{event_type} {operation} on {resource}"


def match(event_type: str, resource: str, operation: str, details: dict) -> dict:
    # Rule pre-check: known-reliable pattern, don't leave it to a shaky embedding match
    if event_type == 'file_access':
        path = details.get('path', resource) or ''
        if any(p in path for p in SENSITIVE_PATH_PATTERNS):
            return {
                'matched': True,
                'attack_type': 'Excessive Agency Exploitation (OWASP LLM08)',
                'mitre_ref': 'AML.T0054',
                'target_component': 'Agent Permission Model',
                'source_dataset': 'rule:sensitive_path',
                'similarity_score': None,
                'note': 'Matched by explicit rule on sensitive path pattern, not embedding similarity.',
            }

    text = event_to_text(event_type, resource, operation, details)
    vec = _vectorizer.transform([text])
    sims = cosine_similarity(vec, _matrix)[0]
    best_idx = sims.argmax()
    best_score = float(sims[best_idx])

    if event_type in KNOWN_GAPS:
        return {
            'matched': False,
            'similarity_score': round(best_score, 3),
            'note': KNOWN_GAPS[event_type] + f' (best embedding candidate scored {best_score:.3f}, discarded as unreliable.)'
        }

    if best_score < SIMILARITY_THRESHOLD:
        return {
            'matched': False,
            'similarity_score': round(best_score, 3),
            'note': 'No taxonomy row cleared the similarity threshold; treat as unclassified.'
        }

    row = TAXONOMY.iloc[best_idx]
    return {
        'matched': True,
        'attack_type': row['attack_type'],
        'mitre_ref': row['mitre_ref'],
        'target_component': row['target_component'],
        'severity_score': row['severity_score'],
        'source_dataset': row['source_dataset'],
        'similarity_score': round(best_score, 3),
        'matched_description': row['description'],
    }


if __name__ == '__main__':
    print(f"Taxonomy index: {len(TAXONOMY)} rows "
          f"({(TAXONOMY['source_dataset'] == 'ai_agent_core_threats.csv').sum()} from ai_agent_core_threats.csv, "
          f"{(TAXONOMY['source_dataset'] == 'agent_attack_taxonomy.csv').sum()} from agent_attack_taxonomy.csv)")