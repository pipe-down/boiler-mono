import * as React from 'react';

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;
type TableSectionProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;
type TableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement>;
type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export function Table({ children, style, ...rest }: TableProps) {
  return (
    <table
      {...rest}
      style={{ width: '100%', borderCollapse: 'collapse', ...(style ?? {}) }}
    >
      {children}
    </table>
  );
}

export function THead({ children, style, ...rest }: TableSectionProps) {
  return (
    <thead
      {...rest}
      style={{ borderBottom: '1px solid #e5e7eb', ...(style ?? {}) }}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, ...rest }: TableSectionProps) {
  return <tbody {...rest}>{children}</tbody>;
}

export function TR({ children, ...rest }: TableRowProps) {
  return <tr {...rest}>{children}</tr>;
}

export function TH({ children, style, ...rest }: TableHeaderCellProps) {
  return (
    <th
      {...rest}
      style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600, ...(style ?? {}) }}
    >
      {children}
    </th>
  );
}

export function TD({ children, style, ...rest }: TableCellProps) {
  return (
    <td
      {...rest}
      style={{ padding: '8px 6px', borderBottom: '1px solid #f3f4f6', ...(style ?? {}) }}
    >
      {children}
    </td>
  );
}
