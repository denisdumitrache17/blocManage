# Conturi de Test — BlocManage

> Toate conturile au fost create prin `backend/seed.js`.
> Parola comună: **Test1234**

## Conturi

| Rol | Email | Parolă | Detalii |
|-----|-------|--------|---------|
| PLATFORM_ADMIN | admin@blocmanage.ro | Test1234 | Administrator platformă — acces complet la toate cererile, facturile, contractele; poate asigna firme la cereri |
| HOA (Asociație) | hoa@test.ro | Test1234 | Președinte: Ion Popescu, Administrator: Maria Ionescu, Adresă bloc: Str. Florilor nr. 10, Bloc A, București |
| FIRM (Firmă) | firma@test.ro | Test1234 | Companie: TehnoFix SRL, CUI: RO12345678, Telefon: 0722111222 |
| TENANT (Locatar) | locatar@test.ro | Test1234 | Nume: Alexandru Dumitrescu, Telefon: 0733444555, Apartament: 12, Aprobat: Da |

## Date seed suplimentare

- **2 scări**: Scara A (20 apartamente), Scara B (16 apartamente)
- **3 elemente portofoliu** pentru firma TehnoFix SRL
- **4 cereri**: PENDING, VALIDATED, IN_PROGRESS, COMPLETED
- **1 recenzie**: 5 stele pe cererea finalizată
- **2 facturi**: 1 PAID (450 RON), 1 UNPAID (1200.50 RON)
- **1 contract**: Activ până la 31.12.2026
