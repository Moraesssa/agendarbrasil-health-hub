# População de Dados Mock

Este documento detalha a população de dados mock utilizada no sistema para fins de desenvolvimento e teste. A fonte principal desses dados é o arquivo `src/services/mockDataService.ts`.

## 1. Pacientes Mock

Abaixo está a lista completa dos 40 pacientes mockados no sistema, com seus respectivos detalhes.

| ID | Nome Completo | E-mail | CPF | Telefone | Cidade | Estado | Endereço | Data de Nasc. | Sexo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `pat-001` | Ana Silva Santos | ana.silva@email.com | `***.***.***-01` | (11) 99001-1234 | São Paulo | SP | Rua Augusta, 1000 | 1985-03-15 | feminino |
| `pat-002` | Carlos Eduardo Oliveira | carlos.oliveira@email.com | `***.***.***-12` | (11) 99002-2345 | São Paulo | SP | Av. Paulista, 2000 | 1978-07-22 | masculino |
| `pat-003` | Mariana Costa Lima | mariana.lima@email.com | `***.***.***-23` | (11) 99003-3456 | São Paulo | SP | Rua Oscar Freire, 300 | 1992-11-08 | feminino |
| `pat-004` | João Pedro Ferreira | joao.ferreira@email.com | `***.***.***-34` | (11) 99004-4567 | São Paulo | SP | Rua da Consolação, 500 | 1990-01-30 | masculino |
| `pat-005` | Beatriz Almeida Souza | beatriz.souza@email.com | `***.***.***-45` | (11) 99005-5678 | São Paulo | SP | Av. Faria Lima, 1500 | 1988-09-12 | feminino |
| `pat-006` | Rafael Santos Pereira | rafael.pereira@email.com | `***.***.***-56` | (11) 99006-6789 | São Paulo | SP | Rua Itaim Bibi, 800 | 1983-05-20 | masculino |
| `pat-007` | Camila Rodrigues Silva | camila.silva@email.com | `***.***.***-67` | (11) 99007-7890 | São Paulo | SP | Av. Rebouças, 1200 | 1995-12-03 | feminino |
| `pat-008` | Felipe Nascimento Costa | felipe.costa@email.com | `***.***.***-78` | (11) 99008-8901 | São Paulo | SP | Rua Pamplona, 600 | 1987-04-18 | masculino |
| `pat-009` | Isabella Martins Rocha | isabella.rocha@email.com | `***.***.***-89` | (19) 99009-9012 | Campinas | SP | Av. das Amoreiras, 400 | 1991-08-25 | feminino |
| `pat-010` | Gabriel Torres Mendes | gabriel.mendes@email.com | `***.***.***-90` | (19) 99010-0123 | Campinas | SP | Rua Barão de Jaguara, 700 | 1986-02-14 | masculino |
| `pat-011` | Larissa Barbosa Santos | larissa.santos@email.com | `***.***.***-02` | (13) 99011-1234 | Santos | SP | Av. Ana Costa, 200 | 1989-10-07 | feminino |
| `pat-012` | Bruno Cavalcanti Lima | bruno.lima@email.com | `***.***.***-13` | (13) 99012-2345 | Santos | SP | Rua do Comércio, 150 | 1984-06-11 | masculino |
| `pat-013` | Fernanda Carvalho Alves | fernanda.alves@email.com | `***.***.***-24` | (21) 99013-3456 | Rio de Janeiro | RJ | Rua Copacabana, 300 | 1993-03-28 | feminino |
| `pat-014` | Thiago Moreira Silva | thiago.silva@email.com | `***.***.***-35` | (21) 99014-4567 | Rio de Janeiro | RJ | Av. Atlântica, 1000 | 1980-11-15 | masculino |
| `pat-015` | Juliana Ribeiro Costa | juliana.costa@email.com | `***.***.***-46` | (21) 99015-5678 | Rio de Janeiro | RJ | Rua Visconde de Pirajá, 500 | 1987-09-02 | feminino |
| `pat-016` | André Luiz Campos | andre.campos@email.com | `***.***.***-57` | (21) 99016-6789 | Rio de Janeiro | RJ | Av. Nossa Senhora de Copacabana, 800 | 1982-12-19 | masculino |
| `pat-017` | Patricia Gomes Fernandes | patricia.fernandes@email.com | `***.***.***-68` | (21) 99017-7890 | Niterói | RJ | Rua Cel. Moreira César, 200 | 1990-07-06 | feminino |
| `pat-018` | Leonardo Dias Santos | leonardo.santos@email.com | `***.***.***-79` | (21) 99018-8901 | Niterói | RJ | Av. Ernani do Amaral Peixoto, 400 | 1985-04-23 | masculino |
| `pat-019` | Renata Cardoso Oliveira | renata.oliveira@email.com | `***.***.***-80` | (31) 99019-9012 | Belo Horizonte | MG | Av. Afonso Pena, 1500 | 1988-01-17 | feminino |
| `pat-020` | Marcelo Augusto Reis | marcelo.reis@email.com | `***.***.***-91` | (31) 99020-0123 | Belo Horizonte | MG | Rua da Bahia, 800 | 1981-08-10 | masculino |
| `pat-021` | Aline Monteiro Silva | aline.silva@email.com | `***.***.***-03` | (31) 99021-1234 | Belo Horizonte | MG | Av. Bias Fortes, 600 | 1994-05-29 | feminino |
| `pat-022` | Ricardo Nunes Costa | ricardo.costa@email.com | `***.***.***-14` | (34) 99022-2345 | Uberlândia | MG | Av. João Naves de Ávila, 300 | 1983-10-14 | masculino |
| `pat-023` | Vanessa Lopes Martins | vanessa.martins@email.com | `***.***.***-25` | (41) 99023-3456 | Curitiba | PR | Rua XV de Novembro, 700 | 1986-12-08 | feminino |
| `pat-024` | Daniel Henrique Souza | daniel.souza@email.com | `***.***.***-36` | (41) 99024-4567 | Curitiba | PR | Av. Batel, 1200 | 1989-03-21 | masculino |
| `pat-025` | Carolina Freitas Lima | carolina.lima@email.com | `***.***.***-47` | (41) 99025-5678 | Curitiba | PR | Rua Marechal Deodoro, 500 | 1992-07-13 | feminino |
| `pat-026` | Rodrigo Almeida Castro | rodrigo.castro@email.com | `***.***.***-58` | (43) 99026-6789 | Londrina | PR | Av. Higienópolis, 800 | 1984-11-26 | masculino |
| `pat-027` | Priscila Santos Rocha | priscila.rocha@email.com | `***.***.***-69` | (51) 99027-7890 | Porto Alegre | RS | Rua dos Andradas, 900 | 1987-06-05 | feminino |
| `pat-028` | Gustavo Pereira Silva | gustavo.silva@email.com | `***.***.***-70` | (51) 99028-8901 | Porto Alegre | RS | Av. Borges de Medeiros, 1100 | 1981-02-18 | masculino |
| `pat-029` | Tatiana Rodrigues Costa | tatiana.costa@email.com | `***.***.***-81` | (51) 99029-9012 | Porto Alegre | RS | Rua Padre Chagas, 400 | 1990-09-30 | feminino |
| `pat-030` | Fabio Machado Santos | fabio.santos@email.com | `***.***.***-92` | (54) 99030-0123 | Caxias do Sul | RS | Rua Sinimbu, 300 | 1985-12-22 | masculino |
| `pat-031` | Luciana Vieira Alves | luciana.alves@email.com | `***.***.***-04` | (48) 99031-1234 | Florianópolis | SC | Av. Beira Mar Norte, 500 | 1988-04-16 | feminino |
| `pat-032` | Eduardo Silva Mendes | eduardo.mendes@email.com | `***.***.***-15` | (48) 99032-2345 | Florianópolis | SC | Rua Felipe Schmidt, 200 | 1983-08-09 | masculino |
| `pat-033` | Roberta Cardoso Lima | roberta.lima@email.com | `***.***.***-26` | (47) 99033-3456 | Joinville | SC | Rua Príncipe Joinville, 700 | 1991-01-24 | feminino |
| `pat-034` | Marcos Antonio Ferreira | marcos.ferreira@email.com | `***.***.***-37` | (71) 99034-4567 | Salvador | BA | Rua Chile, 300 | 1986-10-07 | masculino |
| `pat-035` | Amanda Souza Oliveira | amanda.oliveira@email.com | `***.***.***-48` | (71) 99035-5678 | Salvador | BA | Av. Tancredo Neves, 1500 | 1989-05-12 | feminino |
| `pat-036` | Paulo Roberto Santos | paulo.santos@email.com | `***.***.***-59` | (75) 99036-6789 | Feira de Santana | BA | Rua Senhor do Bonfim, 400 | 1982-11-28 | masculino |
| `pat-037` | Simone Castro Rocha | simone.rocha@email.com | `***.***.***-60` | (81) 99037-7890 | Recife | PE | Rua da Aurora, 600 | 1987-07-04 | feminino |
| `pat-038` | Renato Gomes Silva | renato.silva@email.com | `***.***.***-71` | (81) 99038-8901 | Olinda | PE | Rua do Amparo, 200 | 1984-03-17 | masculino |
| `pat-039` | Cristiane Morais Lima | cristiane.lima@email.com | `***.***.***-82` | (62) 99039-9012 | Goiânia | GO | Av. T-4, 800 | 1990-08-31 | feminino |
| `pat-040` | Alexandre Costa Pereira | alexandre.pereira@email.com | `***.***.***-93` | (62) 99040-0123 | Goiânia | GO | Rua T-25, 500 | 1985-01-19 | masculino |

## 2. Geração Dinâmica de Dados Mock

Além da lista estática de pacientes, o `MockDataService` gera outros dados de forma dinâmica para simular uma API real.

- **Especialidades:** Uma lista fixa de 14 especialidades médicas é retornada (Cardiologia, Clínica Geral, etc.).
- **Estados e Cidades:** O serviço retorna uma lista de estados e, para cada estado, uma lista de cidades correspondentes, com base nos dados dos pacientes mock.
- **Médicos:** A busca por médicos (`getDoctorsByLocationAndSpecialty`) retorna uma lista de médicos fictícios (`Dr. João Silva`, `Dra. Maria Santos`, etc.) de forma simulada, sem uma lista estática.
- **Horários Disponíveis:** A função `getAvailableSlotsByDoctor` gera uma lista de horários para um determinado dia, com alguns horários marcados como `available: false` para simular uma agenda real.
- **Agendamento:** A função `scheduleAppointment` simula o processo de agendamento com um delay de 1 segundo, sempre retornando sucesso.
