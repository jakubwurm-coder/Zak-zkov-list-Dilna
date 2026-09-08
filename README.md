# Zakázkový list – Dílna

PWA aplikace pro zakázkové listy dílny Vans Centre. Funguje na telefonu i počítači a vytváří A4 PDF podle původního papírového vzoru.

## Aktuální funkce
- datum zadání
- zadavatel
- označení vozidla / číslo klíče
- ID vozidla
- kde vozidlo stojí
- kde jsou klíče
- termín dokončení ano/ne + datum
- popis zakázky
- rozpis provedených prací a nakoupených dílů
- datum dokončení / podpis
- fotografie vozidla nebo závady
- komprese fotografie před uložením
- vytvoření A4 PDF
- sdílení PDF přes systémové sdílení iOS
- seznam uložených zakázek
- vyhledávání, otevření, úprava a mazání
- sdílená databáze Supabase
- lokální záloha při výpadku internetu
- automatické dosynchronizování změn po návratu internetu
- fronta pro smazání provedené offline
- PWA režim pro přidání na plochu iPhonu

## Databáze
Zakázkové listy se ukládají do tabulky `workshop_job_sheets` v Supabase. Web komunikuje přes Edge Function `workshop-jobs`.

## Nasazení
Repozitář obsahuje workflow `.github/workflows/pages.yml` pro GitHub Pages. Po zapnutí GitHub Pages pro repozitář se každá změna v `main` automaticky nasadí přes HTTPS.

## Bezpečnost
Databáze není zpřístupněna přímo z klienta; aplikace komunikuje přes Edge Function. Před ostrým veřejným nasazením je vhodné doplnit přihlášení nebo společný PIN pro dílnu.
