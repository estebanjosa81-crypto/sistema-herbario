-- ============================================================================
-- MIGRACIÓN 005 · Columnas de respuesta del administrador en `suggestions`
-- Sistema Herbario Digital HEAA · MySQL 8.0+
-- ----------------------------------------------------------------------------
-- Añade: admin_response, responded_by (+FK a users), responded_at e índice.
-- Sin esto, `suggestions.respond` (responder sugerencias) falla con
-- "Unknown column 'admin_response'" → HTTP 500.
--
-- IDEMPOTENTE: cada cambio se aplica solo si no existe. Seguro de correr varias veces.
--
-- Ejecutar:
--   docker exec -i herbario-db mysql -u root -p<password> herbario_heaa < migrations/005_suggestions_admin_response.sql
--   -- o dentro del cliente mysql:
--   USE herbario_heaa; SOURCE migrations/005_suggestions_admin_response.sql;
-- ============================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS _m005_suggestions//
CREATE PROCEDURE _m005_suggestions()
BEGIN
    DECLARE db_name VARCHAR(64);
    SET db_name = DATABASE();

    -- 1) admin_response
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'suggestions'
          AND COLUMN_NAME = 'admin_response'
    ) THEN
        ALTER TABLE suggestions
            ADD COLUMN admin_response TEXT NULL COMMENT 'Respuesta oficial del administrador' AFTER description;
        SELECT 'suggestions.admin_response: agregada ✓' AS resultado;
    ELSE
        SELECT 'suggestions.admin_response: ya existe, omitida' AS resultado;
    END IF;

    -- 2) responded_by (+ FK a users)
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'suggestions'
          AND COLUMN_NAME = 'responded_by'
    ) THEN
        ALTER TABLE suggestions
            ADD COLUMN responded_by INT NULL COMMENT 'ID del admin que respondió' AFTER admin_response;

        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'suggestions'
              AND CONSTRAINT_NAME = 'fk_suggestions_responded_by'
        ) THEN
            ALTER TABLE suggestions
                ADD CONSTRAINT fk_suggestions_responded_by
                FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        SELECT 'suggestions.responded_by: agregada ✓' AS resultado;
    ELSE
        SELECT 'suggestions.responded_by: ya existe, omitida' AS resultado;
    END IF;

    -- 3) responded_at
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'suggestions'
          AND COLUMN_NAME = 'responded_at'
    ) THEN
        ALTER TABLE suggestions
            ADD COLUMN responded_at TIMESTAMP NULL COMMENT 'Fecha y hora de la respuesta' AFTER responded_by;
        SELECT 'suggestions.responded_at: agregada ✓' AS resultado;
    ELSE
        SELECT 'suggestions.responded_at: ya existe, omitida' AS resultado;
    END IF;

    -- 4) índice sobre responded_at
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = db_name AND TABLE_NAME = 'suggestions'
          AND INDEX_NAME = 'idx_responded_at'
    ) THEN
        ALTER TABLE suggestions ADD INDEX idx_responded_at (responded_at);
        SELECT 'suggestions.idx_responded_at: creado ✓' AS resultado;
    ELSE
        SELECT 'suggestions.idx_responded_at: ya existe, omitido' AS resultado;
    END IF;
END//

DELIMITER ;

CALL _m005_suggestions();
DROP PROCEDURE IF EXISTS _m005_suggestions;

-- ── Verificación final (esperado: 3) ────────────────────────────────────────
SELECT COUNT(*) AS suggestions_cols_ok
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suggestions'
  AND COLUMN_NAME IN ('admin_response', 'responded_by', 'responded_at');

SELECT '✅ Migración 005 (suggestions) completada.' AS resultado_final;
