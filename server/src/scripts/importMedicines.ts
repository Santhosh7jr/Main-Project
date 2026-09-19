import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";

import { from as copyFrom } from "pg-copy-streams";

import pool from "../config/database.js";


// ======================================================
// PATH CONFIGURATION
// ======================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

/*
 * importMedicines.ts is located at:
 *
 * server/src/scripts/importMedicines.ts
 *
 * The CSV is located at:
 *
 * api/model/medicine_dataset_cleaned.csv
 *
 * Therefore:
 *
 * __dirname
 *   → server/src/scripts
 *
 * ../../../
 *   → project root
 *
 * /api/model/
 *   → CSV location
 */

const CSV_PATH = path.resolve(
  __dirname,
  "../../../api/model/medicine_dataset_cleaned.csv",
);


// ======================================================
// IMPORT FUNCTION
// ======================================================

const importMedicines = async () => {

  // --------------------------------------------------
  // Check CSV
  // --------------------------------------------------

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(
      `CSV file not found:\n${CSV_PATH}`,
    );
  }


  const client =
    await pool.connect();


  try {

    console.log("");
    console.log(
      "======================================",
    );

    console.log(
      "MEDGUARD MEDICINE DATA IMPORT",
    );

    console.log(
      "======================================",
    );

    console.log(
      `CSV: ${CSV_PATH}`,
    );

    console.log("");


    // ==================================================
    // 1. CREATE STAGING TABLE
    // ==================================================

    console.log(
      "Creating staging table...",
    );


    await client.query(`
      CREATE TEMP TABLE medicine_import (

        source_id TEXT,

        name TEXT,

        substitute0 TEXT,
        substitute1 TEXT,
        substitute2 TEXT,
        substitute3 TEXT,
        substitute4 TEXT,

        sideEffect0 TEXT,
        sideEffect1 TEXT,
        sideEffect2 TEXT,
        sideEffect3 TEXT,
        sideEffect4 TEXT,
        sideEffect5 TEXT,
        sideEffect6 TEXT,
        sideEffect7 TEXT,
        sideEffect8 TEXT,
        sideEffect9 TEXT,
        sideEffect10 TEXT,
        sideEffect11 TEXT,
        sideEffect12 TEXT,
        sideEffect13 TEXT,
        sideEffect14 TEXT,
        sideEffect15 TEXT,
        sideEffect16 TEXT,
        sideEffect17 TEXT,
        sideEffect18 TEXT,
        sideEffect19 TEXT,
        sideEffect20 TEXT,
        sideEffect21 TEXT,
        sideEffect22 TEXT,
        sideEffect23 TEXT,
        sideEffect24 TEXT,
        sideEffect25 TEXT,
        sideEffect26 TEXT,
        sideEffect27 TEXT,
        sideEffect28 TEXT,
        sideEffect29 TEXT,
        sideEffect30 TEXT,
        sideEffect31 TEXT,
        sideEffect32 TEXT,
        sideEffect33 TEXT,
        sideEffect34 TEXT,
        sideEffect35 TEXT,
        sideEffect36 TEXT,
        sideEffect37 TEXT,
        sideEffect38 TEXT,
        sideEffect39 TEXT,
        sideEffect40 TEXT,
        sideEffect41 TEXT,

        use0 TEXT,
        use1 TEXT,
        use2 TEXT,
        use3 TEXT,
        use4 TEXT,

        "Chemical Class" TEXT,
        "Habit Forming" TEXT,
        "Therapeutic Class" TEXT,
        "Action Class" TEXT

      )
    `);


    // ==================================================
    // 2. LOAD CSV
    // ==================================================

    console.log(
      "Loading CSV into PostgreSQL...",
    );

    console.log(
      "This may take some time...",
    );

    console.log("");


    const copyQuery =
      copyFrom(`
        COPY medicine_import
        FROM STDIN
        WITH (
          FORMAT csv,
          HEADER true,
          NULL ''
        )
      `) as any;


    const copyStream =
      client.query(
        copyQuery,
      ) as any;


    await pipeline(
      fs.createReadStream(
        CSV_PATH,
      ),
      copyStream,
    );


    console.log(
      "CSV loaded successfully.",
    );

    console.log("");


    // ==================================================
    // 3. COUNT STAGING ROWS
    // ==================================================

    const countResult =
      await client.query(`
        SELECT
          COUNT(*)::integer AS count
        FROM medicine_import
      `);


    const totalRows =
      countResult.rows[0].count;


    console.log(
      `CSV rows loaded: ${totalRows}`,
    );


    // ==================================================
    // 4. START TRANSACTION
    // ==================================================

    await client.query(
      "BEGIN",
    );


    // ==================================================
    // 5. INSERT MEDICINES
    // ==================================================

    console.log("");
    console.log(
      "Importing medicines...",
    );


    const medicinesResult =
      await client.query(`
        INSERT INTO medicines
        (
          name,
          generic_name,
          therapeutic_class,
          action_class,
          chemical_class,
          habit_forming
        )

        SELECT
          TRIM(s.name),

          NULL,

          NULLIF(
            TRIM(
              s."Therapeutic Class"
            ),
            ''
          ),

          NULLIF(
            TRIM(
              s."Action Class"
            ),
            ''
          ),

          NULLIF(
            TRIM(
              s."Chemical Class"
            ),
            ''
          ),

          CASE
            WHEN LOWER(
              TRIM(
                COALESCE(
                  s."Habit Forming",
                  ''
                )
              )
            ) IN (
              'true',
              'yes',
              '1',
              'y'
            )
            THEN true

            ELSE false
          END

        FROM
        (
          SELECT DISTINCT ON (
            LOWER(
              TRIM(name)
            )
          )
            *
          FROM medicine_import

          WHERE
            name IS NOT NULL
            AND TRIM(name) <> ''

          ORDER BY
            LOWER(
              TRIM(name)
            ),
            source_id
        ) s

        WHERE NOT EXISTS
        (
          SELECT 1

          FROM medicines m

          WHERE LOWER(
            TRIM(m.name)
          )
          =
          LOWER(
            TRIM(s.name)
          )
        )
      `);


    console.log(
      `Medicines inserted: ${
        medicinesResult.rowCount ?? 0
      }`,
    );


    // ==================================================
    // 6. INSERT MEDICINE USES
    // ==================================================

    console.log("");
    console.log(
      "Importing medicine uses...",
    );


    const usesResult =
      await client.query(`
        INSERT INTO medicine_uses
        (
          medicine_id,
          use_name
        )

        SELECT DISTINCT
          m.id,
          TRIM(u.use_name)

        FROM medicine_import s

        INNER JOIN medicines m
          ON LOWER(
            TRIM(m.name)
          )
          =
          LOWER(
            TRIM(s.name)
          )

        CROSS JOIN LATERAL
        (
          VALUES
            (s.use0),
            (s.use1),
            (s.use2),
            (s.use3),
            (s.use4)

        ) AS u(use_name)

        WHERE
          u.use_name IS NOT NULL

          AND TRIM(
            u.use_name
          ) <> ''

          AND NOT EXISTS
          (
            SELECT 1

            FROM medicine_uses mu

            WHERE
              mu.medicine_id = m.id

              AND LOWER(
                TRIM(mu.use_name)
              )
              =
              LOWER(
                TRIM(u.use_name)
              )
          )
      `);


    console.log(
      `Uses inserted: ${
        usesResult.rowCount ?? 0
      }`,
    );


    // ==================================================
    // 7. INSERT SIDE EFFECTS
    // ==================================================

    console.log("");
    console.log(
      "Importing documented side effects...",
    );


    const sideEffectsResult =
      await client.query(`
        INSERT INTO medicine_side_effects
        (
          medicine_id,
          side_effect_name
        )

        SELECT DISTINCT
          m.id,
          TRIM(
            se.side_effect_name
          )

        FROM medicine_import s

        INNER JOIN medicines m
          ON LOWER(
            TRIM(m.name)
          )
          =
          LOWER(
            TRIM(s.name)
          )

        CROSS JOIN LATERAL
        (
          VALUES
            (s.sideEffect0),
            (s.sideEffect1),
            (s.sideEffect2),
            (s.sideEffect3),
            (s.sideEffect4),
            (s.sideEffect5),
            (s.sideEffect6),
            (s.sideEffect7),
            (s.sideEffect8),
            (s.sideEffect9),
            (s.sideEffect10),
            (s.sideEffect11),
            (s.sideEffect12),
            (s.sideEffect13),
            (s.sideEffect14),
            (s.sideEffect15),
            (s.sideEffect16),
            (s.sideEffect17),
            (s.sideEffect18),
            (s.sideEffect19),
            (s.sideEffect20),
            (s.sideEffect21),
            (s.sideEffect22),
            (s.sideEffect23),
            (s.sideEffect24),
            (s.sideEffect25),
            (s.sideEffect26),
            (s.sideEffect27),
            (s.sideEffect28),
            (s.sideEffect29),
            (s.sideEffect30),
            (s.sideEffect31),
            (s.sideEffect32),
            (s.sideEffect33),
            (s.sideEffect34),
            (s.sideEffect35),
            (s.sideEffect36),
            (s.sideEffect37),
            (s.sideEffect38),
            (s.sideEffect39),
            (s.sideEffect40),
            (s.sideEffect41)

        ) AS se(side_effect_name)

        WHERE
          se.side_effect_name IS NOT NULL

          AND TRIM(
            se.side_effect_name
          ) <> ''

          AND NOT EXISTS
          (
            SELECT 1

            FROM medicine_side_effects mse

            WHERE
              mse.medicine_id = m.id

              AND LOWER(
                TRIM(
                  mse.side_effect_name
                )
              )
              =
              LOWER(
                TRIM(
                  se.side_effect_name
                )
              )
          )
      `);


    console.log(
      `Side effects inserted: ${
        sideEffectsResult.rowCount ?? 0
      }`,
    );


    // ==================================================
    // 8. COMMIT
    // ==================================================

    await client.query(
      "COMMIT",
    );


    // ==================================================
    // 9. FINAL COUNTS
    // ==================================================

    const finalMedicines =
      await client.query(`
        SELECT
          COUNT(*)::integer AS count
        FROM medicines
      `);


    const finalUses =
      await client.query(`
        SELECT
          COUNT(*)::integer AS count
        FROM medicine_uses
      `);


    const finalSideEffects =
      await client.query(`
        SELECT
          COUNT(*)::integer AS count
        FROM medicine_side_effects
      `);


    console.log("");
    console.log(
      "======================================",
    );

    console.log(
      "IMPORT COMPLETED SUCCESSFULLY",
    );

    console.log(
      "======================================",
    );

    console.log(
      `Total medicines: ${
        finalMedicines.rows[0].count
      }`,
    );

    console.log(
      `Total uses: ${
        finalUses.rows[0].count
      }`,
    );

    console.log(
      `Total side effects: ${
        finalSideEffects.rows[0].count
      }`,
    );

    console.log(
      "======================================",
    );

  } catch (error) {

    // ==================================================
    // ROLLBACK
    // ==================================================

    try {
      await client.query(
        "ROLLBACK",
      );
    } catch {
      // Ignore rollback errors
    }


    console.error("");
    console.error(
      "======================================",
    );

    console.error(
      "IMPORT FAILED",
    );

    console.error(
      "All database changes were rolled back.",
    );

    console.error(
      "======================================",
    );

    console.error(error);

    throw error;

  } finally {

    client.release();
  }
};


// ======================================================
// RUN IMPORT
// ======================================================

importMedicines()
  .then(async () => {

    await pool.end();

    process.exit(0);
  })
  .catch(async () => {

    await pool.end();

    process.exit(1);
  });