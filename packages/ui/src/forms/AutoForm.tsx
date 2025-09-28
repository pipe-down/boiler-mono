'use client';
import * as React from 'react';
import { Input, Textarea, Checkbox, FormRow } from '../Input';
type Field = { name:string; type:'string'|'text'|'int'|'long'|'boolean'|'instant'|'uuid'; label?:string };
type Schema = { fields: Field[] };
export function AutoForm({ schema, value, onChange }:{ schema:Schema, value:any, onChange:(v:any)=>void }){
  const set=(k:string,v:any)=>onChange({...value,[k]:v});
  return (
    <div>
      {schema.fields.map(f=>{
        const label = f.label ?? f.name;
        if(f.type==='boolean'){
          return <FormRow key={f.name} label={label}><Checkbox label={label} checked={!!value[f.name]} onChange={e=>set(f.name, e.currentTarget.checked)} /></FormRow>;
        }
        if(f.type==='text'){
          return <FormRow key={f.name} label={label}><Textarea value={value[f.name]??''} onChange={e=>set(f.name, e.currentTarget.value)} /></FormRow>;
        }
        return <FormRow key={f.name} label={label}><Input value={value[f.name]??''} onChange={e=>set(f.name, e.currentTarget.value)} /></FormRow>;
      })}
    </div>
  );
}
