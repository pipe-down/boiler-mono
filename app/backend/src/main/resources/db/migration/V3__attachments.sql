create table if not exists attachment(
  id bigserial primary key,
  room_code varchar(120) not null,
  uploader_id bigint not null references app_user(id) on delete cascade,
  s3_key varchar(255) not null,
  content_type varchar(120) not null,
  bytes bigint not null,
  created_at timestamptz not null default now()
);
