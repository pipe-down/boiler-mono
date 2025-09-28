const path = require('path');

function tokenize(value) {
  return (value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[\-_.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function capitalize(part) {
  if (!part) return '';
  const lower = part.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function camelCase(value) {
  const parts = tokenize(value);
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return first.toLowerCase() + rest.map(capitalize).join('');
}

function pascalCase(value) {
  return tokenize(value).map(capitalize).join('');
}

function paramCase(value) {
  return tokenize(value).map((part) => part.toLowerCase()).join('-');
}

function snakeCase(value) {
  return tokenize(value).map((part) => part.toLowerCase()).join('_');
}

function sentenceCase(value) {
  const parts = tokenize(value).map((part) => part.toLowerCase());
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  return capitalize(first) + (rest.length ? ' ' + rest.join(' ') : '');
}

const rootDir = path.resolve(__dirname, '..', '..');
const backendJavaRoot = path.join(rootDir, 'app', 'backend', 'src', 'main', 'java');
const backendMigrationRoot = path.join(rootDir, 'app', 'backend', 'src', 'main', 'resources', 'db', 'migration');
const frontendAppRoot = path.join(rootDir, 'app', 'frontend', 'app');

const TYPES = {
  string: {
    javaType: { full: 'java.lang.String', simple: 'String' },
    schemaType: 'string',
    dbType: 'varchar(255)',
    search: true,
  },
  text: {
    javaType: { full: 'java.lang.String', simple: 'String' },
    schemaType: 'text',
    dbType: 'varchar(4000)',
    search: true,
    column: { length: 4000 },
  },
  long: {
    javaType: { full: 'java.lang.Long', simple: 'Long' },
    schemaType: 'long',
    dbType: 'bigint',
  },
  int: {
    javaType: { full: 'java.lang.Integer', simple: 'Integer' },
    schemaType: 'int',
    dbType: 'integer',
  },
  integer: {
    javaType: { full: 'java.lang.Integer', simple: 'Integer' },
    schemaType: 'int',
    dbType: 'integer',
  },
  boolean: {
    javaType: { full: 'java.lang.Boolean', simple: 'Boolean' },
    schemaType: 'boolean',
    dbType: 'boolean',
  },
  instant: {
    javaType: { full: 'java.time.Instant', simple: 'Instant' },
    schemaType: 'instant',
    dbType: 'timestamp',
  },
  uuid: {
    javaType: { full: 'java.util.UUID', simple: 'UUID' },
    schemaType: 'uuid',
    dbType: 'uuid',
    column: { columnDefinition: 'uuid' },
  },
};

function pluralize(word) {
  if (!word) return word;
  if (/[sxz]$/.test(word) || /(?:sh|ch)$/.test(word)) {
    return `${word}es`;
  }
  if (/[^aeiou]y$/.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }
  if (word.endsWith('s')) {
    return `${word}es`;
  }
  return `${word}s`;
}

function toPackagePath(pkg) {
  return pkg.replace(/\./g, '/');
}

function resolveType(rawType) {
  if (!rawType) return TYPES.string;
  const key = rawType.toLowerCase();
  return TYPES[key] || TYPES.string;
}

function normalizeFieldName(raw) {
  if (!raw) return raw;
  return camelCase(raw.replace(/[?!]+$/g, ''));
}

function parseFields(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [rawName, rawType] = part.split(':').map((value) => value.trim());
      const optional = rawName.endsWith('?');
      const cleanedRawName = optional ? rawName.slice(0, -1) : rawName;
      const name = normalizeFieldName(cleanedRawName);
      const typeInfo = resolveType(rawType);
      const columnName = snakeCase(cleanedRawName).replace(/-/g, '_');
      const schemaLabel = sentenceCase(cleanedRawName).replace(/\s+/g, ' ');
      const javaType = typeInfo.javaType;
      const needsImport = !javaType.full.startsWith('java.lang.');
      const columnMeta = typeInfo.column || {};
      return {
        rawName: cleanedRawName,
        name,
        pascalName: pascalCase(name),
        columnName,
        optional,
        javaType,
        schemaType: typeInfo.schemaType,
        dbType: typeInfo.dbType,
        searchable: Boolean(typeInfo.search),
        column: columnMeta,
        schemaLabel,
        imports: needsImport ? [javaType.full] : [],
      };
    });
}

function collectJavaImports(fields) {
  const baseImports = new Set([
    'jakarta.persistence.Column',
    'jakarta.persistence.Entity',
    'jakarta.persistence.Id',
    'jakarta.persistence.Table',
    'java.util.UUID',
  ]);
  fields.forEach((field) => {
    field.imports.forEach((imp) => baseImports.add(imp));
  });
  return Array.from(baseImports).sort();
}

function buildColumnAnnotation(field) {
  const parts = [`name = "${field.columnName}"`];
  parts.push(`nullable = ${field.optional ? 'true' : 'false'}`);
  if (field.column.length) {
    parts.push(`length = ${field.column.length}`);
  }
  if (field.column.columnDefinition) {
    parts.push(`columnDefinition = "${field.column.columnDefinition}"`);
  }
  return `@Column(${parts.join(', ')})`;
}

function buildMigrationLine(field, isLast) {
  const suffix = field.optional ? '' : ' not null';
  const ending = isLast ? '' : ',';
  return `${field.columnName} ${field.dbType}${suffix}${ending}`;
}

function buildSchemaField(field, index, all) {
  return {
    name: field.name,
    type: field.schemaType,
    label: field.schemaLabel,
    required: !field.optional,
    isLast: all ? index === all.length - 1 : true,
  };
}

function domainModel(answers) {
  const nameInput = answers.name.trim();
  const basePackage = answers.package.trim();
  const parsedFields = parseFields(answers.fields);
  const paramName = paramCase(nameInput);
  const collection = pluralize(paramName);
  const tableName = snakeCase(collection).replace(/-/g, '_');
  const packagePath = toPackagePath(basePackage);
  const segments = basePackage.split('.');
  const parentPackage = segments.length > 1 ? segments.slice(0, -1).join('.') : basePackage;
  const commonDataPackage = `${parentPackage}.common.data`;
  const javaImports = collectJavaImports(parsedFields);
  const schemaFields = parsedFields.map((field, index, arr) => buildSchemaField(field, index, arr));
  const searchableFields = parsedFields.filter((field) => field.searchable).map((field) => field.name);
  const searchableFieldArgs = searchableFields.map((field) => `"${field}"`).join(', ');
  const defaultSortField = parsedFields.some((field) => field.name === 'createdAt') ? 'createdAt' : 'id';
  const defaultSort = `${defaultSortField},desc`;
  const fields = parsedFields.map((field, index, arr) => ({
    ...field,
    columnAnnotation: buildColumnAnnotation(field),
    migrationLine: buildMigrationLine(field, index === arr.length - 1),
  }));
  const displayFields = fields.slice(0, Math.min(4, fields.length));

  return {
    rawName: nameInput,
    pascalName: pascalCase(nameInput),
    camelName: camelCase(nameInput),
    paramName,
    collection,
    tableName,
    package: basePackage,
    packagePath,
    fields,
    displayFields,
    schemaFields,
    javaImports,
    searchableFields,
    searchableFieldArgs,
    hasSearchableFields: searchableFields.length > 0,
    searchableFieldArgsWithComma: searchableFieldArgs ? `, ${searchableFieldArgs}` : '',
    parentPackage,
    commonDataPackage,
    defaultSortField,
    defaultSort,
    useSpecs: searchableFields.length > 0,
    columnCount: 1 + displayFields.length,
  };
}

module.exports = function (plop) {
  plop.setHelper('pascal', pascalCase);
  plop.setHelper('param', paramCase);
  plop.setHelper('timestamp', () => {
    const d = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  });

  plop.setGenerator('domain', {
    description: 'Generate backend domain + frontend screens (spec aligned)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Domain name (e.g. Article)',
        validate: (input) => (input && input.trim().length > 0) || 'Name is required',
      },
      {
        type: 'input',
        name: 'package',
        message: 'Java base package (e.g. com.example.app.article)',
        validate: (input) => (input && input.includes('.')) || 'Enter a fully-qualified package name',
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Fields (name:type, comma separated. e.g. title:string, views:int, published:boolean, createdAt:instant)',
      },
    ],
    actions: (answers) => {
      const model = domainModel(answers);
      const backendBase = path.join(backendJavaRoot, model.packagePath);
      return [
        {
          type: 'add',
          path: path.join(frontendAppRoot, model.collection, '_schema.ts'),
          templateFile: 'templates/frontend-schema.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(frontendAppRoot, model.collection, 'page.tsx'),
          templateFile: 'templates/frontend-list.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(frontendAppRoot, model.collection, 'new', 'page.tsx'),
          templateFile: 'templates/frontend-new.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(frontendAppRoot, model.collection, '[id]', 'page.tsx'),
          templateFile: 'templates/frontend-detail.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(backendBase, 'domain', `${model.pascalName}.java`),
          templateFile: 'templates/entity.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(backendBase, 'repository', `${model.pascalName}Repository.java`),
          templateFile: 'templates/repo.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(backendBase, 'service', `${model.pascalName}Service.java`),
          templateFile: 'templates/service.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(backendBase, 'web', `${model.pascalName}Controller.java`),
          templateFile: 'templates/controller.hbs',
          data: model,
        },
        {
          type: 'add',
          path: path.join(
            backendMigrationRoot,
            `V{{ timestamp }}__create_${model.collection.replace(/-/g, '_')}.sql`,
          ),
          templateFile: 'templates/migration.hbs',
          data: model,
        },
      ];
    },
  });
};

module.exports.domainModel = domainModel;
