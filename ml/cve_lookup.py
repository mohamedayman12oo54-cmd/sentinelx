"""
Model 3: framework/version -> CVE lookup.

Fixes vs. the backend's example response:
"No known exploited vulnerability was found for the detected framework version"
at confidence 1.0 was wrong for CrewAI -- nvd_ai_cves_enriched.csv doesn't cover
CrewAI at all (only General LLM Application, AutoGPT, LangChain,
OpenAI Agents SDK, LlamaIndex). "Not covered" and "checked, found nothing" are
different claims and this lookup keeps them distinct.
"""
import pandas as pd
import config

NVD = pd.read_csv(config.NVD_AI_CVES_CSV)
KEV = pd.read_csv(config.KEV_CSV)

COVERED_FRAMEWORKS = set(NVD['agent_framework'].dropna().unique()) - {'General LLM Application'}


def lookup(framework: str, agent_version: str = None) -> dict:
    framework_match = framework in COVERED_FRAMEWORKS

    if not framework_match:
        return {
            'framework_match': False,
            'covered_frameworks': sorted(COVERED_FRAMEWORKS),
            'cve_id': None,
            'exploited_in_wild': None,
            'severity': None,
            'note': (
                f'"{framework}" is not a covered value in nvd_ai_cves_enriched.csv. '
                f'This is "not checked", not "checked and clean" -- do not report as safe.'
            ),
        }

    matches = NVD[NVD['agent_framework'] == framework].sort_values('base_score', ascending=False)
    top = matches.iloc[0]

    kev_ids = set(KEV['cveID'])
    exploited = top['cve_id'] in kev_ids

    return {
        'framework_match': True,
        'cve_id': top['cve_id'],
        'base_score': float(top['base_score']),
        'severity': top['severity'],
        'exploited_in_wild': exploited,
        'note': None,
    }


if __name__ == '__main__':
    print("Frameworks with real CVE coverage:", sorted(COVERED_FRAMEWORKS))
    for fw in ['CrewAI', 'LangChain', 'AutoGPT']:
        print(f"\n{fw}:", lookup(fw))
