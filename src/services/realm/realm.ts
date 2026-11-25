import type Realm from 'realm';
import { Platform, TurboModuleRegistry, NativeModules } from 'react-native';
import { realmSchemas } from './schemas';

let realmInstance: Realm | null = null;
let realmOpeningPromise: Promise<Realm | null> | null = null;
let nativeCheckDone: boolean = false;
let nativeAvailable: boolean = false;

/**
 * Checks whether the compiled Realm native C++ binary is linked into this runtime.
 * In Expo Go, native Realm binary is absent (requires a development build).
 * Checking first prevents "Could not find the Realm binary" exceptions from firing.
 */
export function hasRealmNativeBinary(): boolean {
  if (nativeCheckDone) {
    return nativeAvailable;
  }
  nativeCheckDone = true;

  if (Platform.OS === 'web') {
    nativeAvailable = false;
    return false;
  }

  try {
    // 1. Check React Native TurboModuleRegistry (New Architecture)
    if (typeof TurboModuleRegistry?.get === 'function') {
      const turboModule = TurboModuleRegistry.get('Realm');
      if (turboModule) {
        nativeAvailable = true;
        return true;
      }
    }

    // 2. Check NativeModules bridge
    if (NativeModules && (NativeModules.Realm || NativeModules.RealmNativeModule)) {
      nativeAvailable = true;
      return true;
    }

    // 3. Check global JSI bindings
    const g = globalThis as any;
    if (g?.Realm || g?.__realmNativeModule) {
      nativeAvailable = true;
      return true;
    }
  } catch {
    nativeAvailable = false;
    return false;
  }

  nativeAvailable = false;
  return false;
}

export async function getRealm(): Promise<Realm | null> {
  if (!hasRealmNativeBinary()) {
    return null;
  }

  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance;
  }

  if (realmOpeningPromise) {
    return realmOpeningPromise;
  }

  try {
    const RealmLib = require('realm');
    const RealmConstructor = RealmLib?.default || RealmLib;

    realmOpeningPromise = RealmConstructor.open({
      schema: realmSchemas,
      schemaVersion: 1,
      deleteRealmIfMigrationNeeded: true,
    })
      .then((realm: Realm) => {
        realmInstance = realm;
        realmOpeningPromise = null;
        return realm;
      })
      .catch((err: any) => {
        console.warn('[Realm] Could not open database file:', err?.message);
        realmOpeningPromise = null;
        return null;
      });

    return realmOpeningPromise;
  } catch (err: any) {
    console.warn('[Realm] Error initializing native Realm:', err?.message);
    return null;
  }
}

export async function closeRealm(): Promise<void> {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
    realmInstance = null;
  }
}
