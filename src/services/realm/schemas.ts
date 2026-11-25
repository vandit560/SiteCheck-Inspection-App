import type Realm from 'realm';

export const ChecklistItemSchema: Realm.ObjectSchema = {
  name: 'ChecklistItem',
  embedded: true,
  properties: {
    id: 'string',
    text: 'string',
  },
};

export const InspectionSchema: Realm.ObjectSchema = {
  name: 'Inspection',
  primaryKey: 'id',
  properties: {
    id: 'string',
    siteName: 'string',
    address: 'string',
    scheduledAt: 'string',
    checklist: { type: 'list', objectType: 'ChecklistItem' },
  },
};

export const DraftItemSchema: Realm.ObjectSchema = {
  name: 'DraftItem',
  embedded: true,
  properties: {
    itemId: 'string',
    result: 'string?',
    note: 'string?',
    updatedAt: 'string',
  },
};

export const DraftInspectionSchema: Realm.ObjectSchema = {
  name: 'DraftInspection',
  primaryKey: 'inspectionId',
  properties: {
    inspectionId: 'string',
    lastSavedAt: 'string',
    items: { type: 'list', objectType: 'DraftItem' },
  },
};

export const OutboxResultSchema: Realm.ObjectSchema = {
  name: 'OutboxResult',
  embedded: true,
  properties: {
    itemId: 'string',
    result: 'string',
    note: 'string?',
  },
};

export const OutboxItemSchema: Realm.ObjectSchema = {
  name: 'OutboxItem',
  primaryKey: 'inspectionId',
  properties: {
    inspectionId: 'string',
    siteName: 'string',
    address: 'string',
    completedAt: 'string',
    status: 'string',
    attempts: { type: 'int', default: 0 },
    queuedAt: 'string',
    lastAttemptAt: 'string?',
    lastError: 'string?',
    syncedAt: 'string?',
    results: { type: 'list', objectType: 'OutboxResult' },
  },
};

export const SyncedRecordSchema: Realm.ObjectSchema = {
  name: 'SyncedRecord',
  primaryKey: 'inspectionId',
  properties: {
    inspectionId: 'string',
    receivedAt: 'string',
  },
};

export const AppSettingSchema: Realm.ObjectSchema = {
  name: 'AppSetting',
  primaryKey: 'key',
  properties: {
    key: 'string',
    value: 'string',
  },
};

export const realmSchemas = [
  ChecklistItemSchema,
  InspectionSchema,
  DraftItemSchema,
  DraftInspectionSchema,
  OutboxResultSchema,
  OutboxItemSchema,
  SyncedRecordSchema,
  AppSettingSchema,
];
