-- Derived company metrics, computed rather than stored.
--
-- Four of the discovery filters — evidence completeness, government experience,
-- funding stage and funding band — are not columns on `startups` and must never
-- become ones. Each is a reading over related rows that change independently of
-- the company record: a company that files a document, wins a work order or
-- discloses a round changes its reading without editing its profile. A stored
-- copy would be correct on the day it was written and quietly wrong afterwards,
-- and an officer reading a stale "evidence 82%" has no way to know it no longer
-- follows from anything. `company.service.ts` states the same rule for the
-- government analysis; this view holds the line for discovery.
--
-- A plain view, not a materialised one, for the same reason: refresh scheduling
-- is one more thing that can silently stop.
--
-- Everything below counts rows. Nothing is imputed, nothing is averaged into
-- existence, and absence scores zero rather than being filled with a plausible
-- number.

CREATE OR REPLACE VIEW startup_derived_metrics AS
WITH
/* Documents actually attached to the company, and how many of the six
   categories a department asks for before a pilot are represented. Counted by
   DISTINCT category: twelve financial statements are not six categories. */
doc AS (
  SELECT
    sd."startupId"                                          AS startup_id,
    COUNT(*)                                                AS document_count,
    COUNT(DISTINCT sd.category) FILTER (
      WHERE sd.category IN (
        'CORPORATE_LEGAL', 'KYC', 'FINANCIAL', 'COMPLIANCE', 'TECHNOLOGY', 'PILOT'
      )
    )                                                       AS required_doc_categories
  FROM startup_documents sd
  GROUP BY sd."startupId"
),

/* Government programme history. `workOrderValue IS NOT NULL` is the signal that
   matters for this problem statement: it separates a company that entered a
   programme from one that was actually issued work against it. */
part AS (
  SELECT
    p."startupId"                                           AS startup_id,
    COUNT(*)                                                AS participation_count,
    COUNT(*) FILTER (WHERE p."workOrderValue" IS NOT NULL)  AS work_order_count
  FROM startup_program_participations p
  GROUP BY p."startupId"
),

/* Pilots run on this platform. A pilot is government delivery too, and the one
   kind this platform can show the whole record of. */
pil AS (
  SELECT
    pl."startupId"                                          AS startup_id,
    COUNT(*)                                                AS pilot_count
  FROM pilots pl
  GROUP BY pl."startupId"
),

/* Distinct departments engaged, across both routes. Two departments is a
   materially different claim from two engagements with one department, and it
   is the only one of the two that evidences transferability. */
dept AS (
  SELECT startup_id, COUNT(DISTINCT department) AS department_count
  FROM (
    SELECT p."startupId" AS startup_id, p."sponsoringDepartment" AS department
      FROM startup_program_participations p
     WHERE p."sponsoringDepartment" IS NOT NULL
    UNION
    SELECT pl."startupId", pl.department
      FROM pilots pl
  ) d
  GROUP BY startup_id
),

/* Disclosed funding. `roundType` is free text because sources word it however
   they word it, so it is normalised here rather than at write time — a mapping
   in a view can be corrected, a mangled column cannot be un-mangled. `pre-seed`
   is tested before `seed` because it contains it. */
fund AS (
  SELECT
    f."startupId"                                           AS startup_id,
    COUNT(*)                                                AS funding_round_count,
    COALESCE(SUM(f.amount), 0)                              AS total_funding_raised,
    MAX(
      CASE
        WHEN lower(f."roundType") LIKE '%pre-seed%'
          OR lower(f."roundType") LIKE '%pre seed%'
          OR lower(f."roundType") LIKE '%angel%'            THEN 2
        WHEN lower(f."roundType") LIKE '%series b%'
          OR lower(f."roundType") LIKE '%series c%'
          OR lower(f."roundType") LIKE '%series d%'
          OR lower(f."roundType") LIKE '%pre-ipo%'
          OR lower(f."roundType") LIKE '%growth%'           THEN 5
        WHEN lower(f."roundType") LIKE '%series a%'         THEN 4
        WHEN lower(f."roundType") LIKE '%seed%'             THEN 3
        WHEN lower(f."roundType") LIKE '%grant%'
          OR lower(f."roundType") LIKE '%award%'
          OR lower(f."roundType") LIKE '%scheme%'           THEN 1
        ELSE 2
      END
    )                                                       AS funding_stage_rank
  FROM funding_rounds f
  GROUP BY f."startupId"
)

SELECT
  s.id                                                      AS startup_id,

  COALESCE(doc.document_count, 0)                           AS document_count,
  COALESCE(doc.required_doc_categories, 0)                  AS required_doc_categories,
  COALESCE(part.participation_count, 0)                     AS participation_count,
  COALESCE(part.work_order_count, 0)                        AS work_order_count,
  COALESCE(pil.pilot_count, 0)                              AS pilot_count,
  COALESCE(dept.department_count, 0)                        AS department_count,
  COALESCE(fund.funding_round_count, 0)                     AS funding_round_count,
  COALESCE(fund.total_funding_raised, 0)                    AS total_funding_raised,

  /* Ordered vocabulary. The rank travels with the label so a caller can filter
     "at least SEED" without re-encoding the ordering at every call site. */
  COALESCE(fund.funding_stage_rank, 0)                      AS funding_stage_rank,
  CASE COALESCE(fund.funding_stage_rank, 0)
    WHEN 0 THEN 'BOOTSTRAPPED'
    WHEN 1 THEN 'GRANT'
    WHEN 2 THEN 'PRE_SEED'
    WHEN 3 THEN 'SEED'
    WHEN 4 THEN 'SERIES_A'
    ELSE        'SERIES_B_PLUS'
  END                                                       AS funding_stage,

  /* Bands, not figures. A band is defensible from a disclosed total; a precise
     rupee number implies a verification nobody performed. */
  CASE
    WHEN COALESCE(fund.total_funding_raised, 0) = 0 THEN 'NONE'
    WHEN fund.total_funding_raised <   5000000      THEN 'UNDER_50L'
    WHEN fund.total_funding_raised <  20000000      THEN '50L_2CR'
    WHEN fund.total_funding_raised < 100000000      THEN '2CR_10CR'
    ELSE                                                 'OVER_10CR'
  END                                                       AS funding_band,

  CASE
    WHEN COALESCE(dept.department_count, 0) >= 2                                      THEN 'MULTI_DEPARTMENT'
    WHEN COALESCE(part.work_order_count, 0) >= 1 OR COALESCE(pil.pilot_count, 0) >= 1 THEN 'WORK_ORDER'
    WHEN COALESCE(part.participation_count, 0) >= 1                                   THEN 'PROGRAM'
    ELSE                                                                                   'NONE'
  END                                                       AS government_experience,

  CASE
    WHEN COALESCE(dept.department_count, 0) >= 2                                      THEN 3
    WHEN COALESCE(part.work_order_count, 0) >= 1 OR COALESCE(pil.pilot_count, 0) >= 1 THEN 2
    WHEN COALESCE(part.participation_count, 0) >= 1                                   THEN 1
    ELSE                                                                                   0
  END                                                       AS government_experience_rank,

  /*
   * Evidence completeness, 0-100.
   *
   * Four components, each a count of what is present over what is asked for,
   * weighted by how much a department actually relies on it:
   *
   *   profile   30  the seven fields without which the record cannot be read
   *   dossier   40  the six document categories asked for before a pilot
   *   assurance 15  whether compliance, security and data protection were answered at all
   *   pilot     15  the four fields describing how a pilot would be run
   *
   * The dossier carries the largest share because it is the only component
   * backed by an attached artefact rather than by the company's own prose.
   * `pilotDurationDays` is counted in both the profile and the pilot component:
   * it is load-bearing for each, and dropping it from either would understate a
   * real gap.
   *
   * Nothing is rounded up. A company that has said nothing reads as empty.
   */
  ROUND(
      30.0 * (
        ( (s."legalName"         IS NOT NULL AND s."legalName"        <> '')::int
        + (s.sector              IS NOT NULL AND s.sector             <> '')::int
        + (s."problemSolved"     IS NOT NULL AND s."problemSolved"    <> '')::int
        + (s."solutionSummary"   IS NOT NULL AND s."solutionSummary"  <> '')::int
        + (COALESCE(array_length(s.technologies, 1), 0) > 0)::int
        + (COALESCE(array_length(s.capabilities, 1), 0) > 0)::int
        + (s."pilotDurationDays" IS NOT NULL)::int
        )::numeric / 7
      )
    + 40.0 * ( LEAST(COALESCE(doc.required_doc_categories, 0), 6)::numeric / 6 )
    + 15.0 * (
        ( (s."complianceStatus"::text    <> 'NOT_PROVIDED')::int
        + (s."cybersecurityStatus"::text <> 'NOT_PROVIDED')::int
        + (s."dataPrivacyStatus"::text   <> 'NOT_PROVIDED')::int
        )::numeric / 3
      )
    + 15.0 * (
        ( (s."pilotDurationDays"          IS NOT NULL)::int
        + (s."pilotTeamSummary"           IS NOT NULL AND s."pilotTeamSummary"           <> '')::int
        + (s."infrastructureRequirements" IS NOT NULL AND s."infrastructureRequirements" <> '')::int
        + (s."deploymentRequirements"     IS NOT NULL AND s."deploymentRequirements"     <> '')::int
        )::numeric / 4
      )
  )::int                                                    AS evidence_completeness

FROM startups s
LEFT JOIN doc  ON doc.startup_id  = s.id
LEFT JOIN part ON part.startup_id = s.id
LEFT JOIN pil  ON pil.startup_id  = s.id
LEFT JOIN dept ON dept.startup_id = s.id
LEFT JOIN fund ON fund.startup_id = s.id;

COMMENT ON VIEW startup_derived_metrics IS
  'Computed readings over related rows: evidence completeness, government experience, funding stage and funding band. Never stored on startups - a copy would go stale the moment a document, work order or funding round is recorded.';
