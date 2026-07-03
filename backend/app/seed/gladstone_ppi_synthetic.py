"""
Synthetic SARS-CoV-2 PPI dataset (Gladstone/Krogan Lab style) for demo.
Generates realistic-looking protein-protein interaction data.
"""

import csv
import random

PROTEINS_VIRAL = [
    "Spike_S1", "Spike_S2", "Nucleocapsid", "Membrane", "Envelope",
    "ORF1a", "ORF1b", "ORF3a", "ORF6", "ORF7a", "ORF8", "ORF10",
]

PROTEINS_HOST = [
    "ACE2", "TMPRSS2", "CTSL", "BASP1", "NUP98", "RPL13", "COX5A",
    "ATP5A1", "HSPA5", "CANX", "CALR", "PPIA", "YWHAG", "IQGAP1",
    "MYH9", "ACTB", "TUBA1B", "EEF1A1", "HSP90AA1", "HSP90AB1",
    "NUP153", "NUP62", "NUP214", "NUP358", "NUP88",
]

INTERACTIONS = []

for viral in PROTEINS_VIRAL:
    for host in random.sample(PROTEINS_HOST, random.randint(3, 6)):
        confidence = round(random.uniform(0.6, 1.0), 3)
        evidence = random.choice(["AP-MS", "Y2H", "Proximity labeling", "Co-IP"])
        INTERACTIONS.append({
            "protein_a": viral,
            "protein_b": host,
            "confidence": confidence,
            "evidence_type": evidence,
            "assay": "SARS-CoV-2_Human_Interactome_2020",
        })

OUTPUT = "gladstone_ppi_synthetic.csv"
with open(OUTPUT, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["protein_a", "protein_b", "confidence", "evidence_type", "assay"])
    writer.writeheader()
    writer.writerows(INTERACTIONS)

print(f"Generated {len(INTERACTIONS)} synthetic PPI interactions -> {OUTPUT}")
