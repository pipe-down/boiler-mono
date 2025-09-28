'use client';
import * as React from 'react';
import { Input } from '../Input';
import { Textarea } from '../textarea';
import { Checkbox } from '../checkbox';
import { Label } from '../label';

type Field = { name:string; type:'string'|'text'|'int'|'long'|'boolean'|'instant'|'uuid'; label?:string };
type Schema = { fields: Field[] };

const FormRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="grid w-full items-center gap-1.5 mb-4">
    <Label htmlFor={label}>{label}</Label>
    {children}
  </div>
);

export function AutoForm({ schema, value, onChange }:{ schema:Schema, value:any, onChange:(v:any)=>void }){
  const set=(k:string,v:any)=>onChange({...value,[k]:v});
  return (
    <div>
      {schema.fields.map(f=>{
        const label = f.label ?? f.name;
        if(f.type==='boolean'){
          return <FormRow key={f.name} label={label}><Checkbox id={label} checked={!!value[f.name]} onCheckedChange={checked => set(f.name, checked)} /></FormRow>;
        }
        if(f.type==='text'){
          return <FormRow key={f.name} label={label}><Textarea id={label} value={value[f.name]??''} onChange={e=>set(f.name, e.currentTarget.value)} /></FormRow>;
        }
        return <FormRow key={f.name} label={label}><Input id={label} value={value[f.name]??''} onChange={e=>set(f.name, e.currentTarget.value)} /></FormRow>;
      })}
    </div>
  );
}
