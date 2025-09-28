create table if not exists app_user (
  id uuid primary key,
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  display_name varchar(255)
);
create table if not exists message (
  id uuid primary key,
  room_id varchar(255),
  sender_id bigint,
  text varchar(2000),
  created_at timestamp
);
