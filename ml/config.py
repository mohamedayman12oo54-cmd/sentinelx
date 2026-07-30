"""
Centralized paths for the SentinelX pipeline.
Everything is relative to this project's root folder, so the code runs
the same on any machine -- no hardcoded /mnt/project or D:/... paths.
"""
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(PROJECT_ROOT, "AI Agent Cybersecurity Dataset", "data")
CORE_DIR = os.path.join(DATA_DIR, "core")
THREAT_INTEL_DIR = os.path.join(DATA_DIR, "threat_intelligence")
VULN_DIR = os.path.join(DATA_DIR, "vulnerabilities")

PIPELINE_DIR = os.path.join(PROJECT_ROOT, "pipeline")
os.makedirs(PIPELINE_DIR, exist_ok=True)

# Dataset file paths
HF_PROMPT_INJECTIONS_CSV = os.path.join(THREAT_INTEL_DIR, "hf_prompt_injections.csv")
NVD_AI_CVES_CSV = os.path.join(VULN_DIR, "nvd_ai_cves_enriched.csv")
KEV_CSV = os.path.join(VULN_DIR, "known_exploited_vulnerabilities.csv")
AI_AGENT_CORE_THREATS_CSV = os.path.join(CORE_DIR, "ai_agent_core_threats.csv")
AGENT_ATTACK_TAXONOMY_CSV = os.path.join(CORE_DIR, "agent_attack_taxonomy.csv")

# Model artifact paths
VECTORIZER_PATH = os.path.join(PIPELINE_DIR, "injection_vectorizer.joblib")
CLASSIFIER_PATH = os.path.join(PIPELINE_DIR, "injection_classifier.joblib")