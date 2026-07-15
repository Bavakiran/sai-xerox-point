---
name: document-comparison
description: Compare two property/registration documents (sale deed, EC, rental agreement, gift deed, settlement deed, or any legal document) — typically a newly drafted document against a previous/original document — to check whether seller details, buyer details, property details, survey numbers, extent/measurement, and years match. Use this skill whenever the user wants to compare two documents, check a new draft against an old document, verify document details before registration, or find mismatches between two legal papers. Produces a PDF report listing every field checked and whether it matches, differs, or is missing. Trigger even if the user just says "compare these two documents" or uploads two files and asks to check them.
---

# Document Comparison (Registration Documents)

Compares a **previous/original document** against a **newly drafted document** (any type: sale deed, EC, rental agreement, gift deed, settlement deed, POA, etc.) and produces a PDF report of matches, mismatches, and missing fields.

## Workflow

### Step 1: Identify the two inputs

Ask the user (if not already clear) which file is the **previous/original document** and which is the **new draft**. Accept any format — PDF, scanned image, photo, Word doc, or plain text.

### Step 2: Read both documents

- If content is already visible in context (uploaded and rendered), use it directly.
- If only a file path is given, follow `/mnt/skills/public/file-reading/SKILL.md` to route to the right reader (PDF, image, docx).
- For scanned/photo PDFs needing OCR or visual inspection, follow `/mnt/skills/public/pdf-reading/SKILL.md`.
- If handwriting or a stamp is unclear, note it as "unclear" rather than guessing.

### Step 3: Extract key fields from each document

Pull out the following fields from BOTH documents (mark "Not found" if a field is absent):

1. Seller name(s) (executant)
2. Buyer name(s) (claimant)
3. Father's/Husband's name of seller & buyer (if present)
4. Property address / door no.
5. Survey number(s) and sub-division number
6. Village / Taluk / District
7. Extent / Measurement (sq.ft, cents, acres — keep original unit)
8. Boundaries (North/South/East/West), if present
9. Document year / date of execution
10. Document number & SRO (Sub-Registrar Office), if present
11. Consideration amount / market value, if present
12. Any special clauses/conditions worth flagging (e.g. mortgage mention, minor's share, dispute mention)

### Step 4: Compare field by field

First check which comparison mode applies:

- **Same-transaction mode** (default): previous doc and new draft describe the SAME sale/transaction (e.g. old handwritten deed vs newly typed clean copy). Here Seller(old) should match Seller(new), and Buyer(old) should match Buyer(new) — compare straight across.
- **Chain-of-title mode**: previous doc and new draft are TWO DIFFERENT transactions in sequence (e.g. previous doc is how the current owner acquired the property; new draft is the current owner now selling it onward). Here the **Buyer in the previous document must match the Seller in the new draft** — that is the correct, expected pattern, NOT a mismatch. Flag it as a mismatch only if buyer(old) and seller(new) do NOT match — that would mean the person selling never actually owned the property, a serious red flag.

If unsure which mode applies, check names first: if Seller(old) ≈ Seller(new), use same-transaction mode. If Buyer(old) ≈ Seller(new), use chain-of-title mode. If genuinely unclear, ask the user before proceeding.

For each field, compare using the correct mode above:
- **Match** — identical or same meaning (minor spelling/spacing differences are still a Match, but note the spelling variant)
- **Mismatch** — values differ where they should be equal (e.g. survey no. 45/2 vs 45/3, extent 1200 sqft vs 1250 sqft, or in chain-of-title mode: buyer(old) ≠ seller(new))
- **Missing** — present in one document, absent in the other

Property details (survey number, extent, address, boundaries) should always match across both documents regardless of mode, since it's the same property — always compare these straight across even in chain-of-title mode.

Pay special attention to fields the user always cares about: seller details, buyer details, property details, survey number(s), extent/measurement, and years — never skip these even if the rest of the document is skimmed.

### Step 5: Generate the PDF report

Follow `/mnt/skills/public/pdf/SKILL.md` for PDF creation. Report structure:

1. **Title**: "Document Comparison Report — [Previous Doc Name] vs [New Draft Name]"
2. **Summary line**: comparison mode used (Same-transaction / Chain-of-title), total fields checked, count of Matches, Mismatches, Missing
3. **Table** with columns: Field | Previous Document | New Draft | Status
   - Highlight/bold any row where Status = Mismatch or Missing so it stands out
4. **Notes section** below table for anything unclear, unreadable, or needing manual double-check
5. Save to `/mnt/user-data/outputs/` and use `present_files` to hand it to the user

### Step 6: Verbal summary

After presenting the PDF, give a one-line summary in chat: how many mismatches found, and which fields need attention (e.g. "Survey number and extent differ — check before registration").

## Notes

- Never assume a mismatch is a typo — always report it and let the human decide.
- If a document is entirely unreadable (bad scan), say so clearly instead of guessing values.
- This skill does not give legal advice on validity — it only flags factual differences between the two documents.
