-- Migración: Ajuste y ordenamiento del Módulo 1 - Planificación (PAC SICP-DNCP + PA-STEP)
-- Pedido de Martin, 2/10/2026. Solo agrega columnas/tablas nuevas (no destructiva).
-- No se toca ninguna columna existente ni se borra/renombra nada.

-- ============================================================
-- 1) Encabezado PAC (Nivel de entidad, Entidad, UOC/UEP, Sub UOC,
--    Unidad jerárquica, Código SICP) — hoy son constantes fijas en
--    src/lib/reportes/pacConstants.ts (PAC_ENCABEZADO_FIJO), sin respaldo
--    en base y no editables por pantalla. Pedido de Martin: que tengan
--    el mismo valor por defecto pero sean editables por llamado.
--    Se agregan como columnas en `llamado` con DEFAULT = valor actual del
--    archivo de constantes, para no alterar ningún dato existente.
-- ============================================================
alter table llamado add column if not exists nivel_entidad text
  default '12 PODER EJECUTIVO';
alter table llamado add column if not exists entidad text
  default '13 MINISTERIO DE OBRAS PÚBLICAS Y COMUNICACIONES';
alter table llamado add column if not exists uoc_uep text
  default 'UEP IE 9517';
alter table llamado add column if not exists sub_uoc text
  default 'DIRECCION DE OBRAS PÚBLICAS';
alter table llamado add column if not exists unidad_jerarquica text
  default '1000000';
alter table llamado add column if not exists codigo_sicp text
  default '2020 – PROYECTO TEJIENDO APOYOS A LA EXCELENCIA EDUCATIVA (TAPE)';

-- Backfill de los llamados existentes (hoy quedarían en null sin esto,
-- porque el DEFAULT de una ALTER TABLE no reescribe filas ya existentes
-- cuando se agrega en el mismo statement sin valor explícito en versiones
-- viejas de Postgres; en Postgres 11+ sí se aplica automáticamente, pero
-- se fuerza el UPDATE igual para que quede explícito y verificable).
update llamado set
  nivel_entidad = coalesce(nivel_entidad, '12 PODER EJECUTIVO'),
  entidad = coalesce(entidad, '13 MINISTERIO DE OBRAS PÚBLICAS Y COMUNICACIONES'),
  uoc_uep = coalesce(uoc_uep, 'UEP IE 9517'),
  sub_uoc = coalesce(sub_uoc, 'DIRECCION DE OBRAS PÚBLICAS'),
  unidad_jerarquica = coalesce(unidad_jerarquica, '1000000'),
  codigo_sicp = coalesce(codigo_sicp, '2020 – PROYECTO TEJIENDO APOYOS A LA EXCELENCIA EDUCATIVA (TAPE)')
where nivel_entidad is null or entidad is null or uoc_uep is null
   or sub_uoc is null or unidad_jerarquica is null or codigo_sicp is null;

-- ============================================================
-- 2) Montos por ejercicio fiscal (distribución del monto_total del PAC
--    entre hasta 6 ejercicios fiscales, para llamados plurianuales).
--    Tabla nueva 1-a-muchos, no toca llamado.monto_total ni
--    llamado.plurianualidad (se siguen usando tal cual).
-- ============================================================
create table if not exists llamado_monto_ejercicio (
  id uuid primary key default gen_random_uuid(),
  llamado_id uuid not null references llamado(id) on delete cascade,
  ejercicio_fiscal integer not null,
  monto numeric(18,2) not null default 0,
  creado_en timestamptz not null default now(),
  unique (llamado_id, ejercicio_fiscal)
);
create index if not exists idx_llamado_monto_ejercicio_llamado
  on llamado_monto_ejercicio(llamado_id);

-- ============================================================
-- 3) Códigos de catálogo y detalles del PAC (filas repetibles
--    Código de catálogo + Descripción + Monto). Antes de esta migración
--    `llamado.pac_codigo_catalogo` y `llamado.pac_descripcion_bien` eran
--    un único valor no repetible — SE MANTIENEN TAL CUAL (no se tocan,
--    siguen alimentando el reporte PAC actual sin cambios) y se agrega
--    esta tabla nueva para el caso de múltiples filas. Cuando el llamado
--    tiene una sola fila de detalle, la aplicación sincroniza esa fila
--    con pac_codigo_catalogo/pac_descripcion_bien automáticamente.
-- ============================================================
create table if not exists pac_codigo_catalogo_detalle (
  id uuid primary key default gen_random_uuid(),
  llamado_id uuid not null references llamado(id) on delete cascade,
  codigo text not null,
  descripcion text,
  monto numeric(18,2) not null default 0,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);
create index if not exists idx_pac_codigo_catalogo_detalle_llamado
  on pac_codigo_catalogo_detalle(llamado_id);

-- ============================================================
-- 4) Campos nuevos de PA-STEP (Banco Mundial), separados de los
--    equivalentes locales DNCP para no mezclar clasificaciones de
--    organismos distintos (dato único: cada campo representa un
--    concepto propio, no se reutiliza un campo DNCP para forzarlo
--    a significar otra cosa en STEP).
-- ============================================================
-- N.º de referencia STEP — distinto de llamado.nro_step (que ya existe
-- y representa otro dato de seguimiento STEP, no el N° de referencia
-- generado al cargar la actividad en el sistema STEP del Banco).
alter table llamado add column if not exists nro_referencia_step text;

-- Categoría de adquisiciones STEP (Bienes/Obras/Servicios de No
-- Consultoría/Consultoría) — distinta de categoria_llamado (Bienes y
-- Obras/Consultor Individual/Firmas Consultoras), que es una
-- clasificación local ya existente y se mantiene sin cambios.
alter table llamado add column if not exists categoria_step text;

-- Método de adquisiciones STEP (depende de categoria_step) — distinto
-- de modalidad_id (catálogo local DNCP/BM ya existente, sin cambios).
alter table llamado add column if not exists metodo_adquisicion_step text;

-- Descripción STEP, con flag de sincronización con nombre_llamado
-- ("Descripción del PAC"). Mientras sincronizado=true, la aplicación
-- actualiza ambos campos juntos; al editar uno de forma independiente
-- se marca sincronizado=false y queda visible la divergencia.
alter table llamado add column if not exists descripcion_step text;
alter table llamado add column if not exists descripcion_step_sincronizada boolean not null default true;

-- Componente STEP (1 - Mejorar los entornos de aprendizaje / 4 - Gestión
-- y monitoreo del proyecto) — distinto de componente_id (sub-componentes
-- internos del proyecto TAPE, concepto ya existente y sin cambios).
alter table llamado add column if not exists componente_step text;

-- Proceso de adquisiciones STEP: número de etapas y número de sobres,
-- como columnas separadas de precalificación (que ya existe y se
-- mantiene). requisitos_calificacion (Una Etapa-Un Sobre / Una Etapa-Dos
-- Sobres) se deja de usar en los formularios pero NO se borra la columna
-- ni sus datos, para no perder histórico ni romper el dato único.
alter table llamado add column if not exists numero_etapas text;
alter table llamado add column if not exists numero_sobres text;

-- Backfill de numero_etapas/numero_sobres a partir del dato existente en
-- requisitos_calificacion, para no perder la información ya cargada.
update llamado set
  numero_etapas = 'Una',
  numero_sobres = case
    when requisitos_calificacion = 'Una Etapa - Un Sobre' then 'Uno'
    when requisitos_calificacion = 'Una Etapa - Dos Sobres' then 'Dos'
    else numero_sobres
  end
where requisitos_calificacion is not null and numero_sobres is null;

-- ============================================================
-- Verificación
-- ============================================================
select
  (select count(*) from llamado where nivel_entidad is not null) as llamados_con_encabezado_pac,
  (select count(*) from llamado) as llamados_total,
  (select count(*) from llamado where numero_sobres is not null) as llamados_con_sobres_migrados,
  (select count(*) from information_schema.tables where table_name = 'llamado_monto_ejercicio') as existe_tabla_monto_ejercicio,
  (select count(*) from information_schema.tables where table_name = 'pac_codigo_catalogo_detalle') as existe_tabla_catalogo_detalle;
