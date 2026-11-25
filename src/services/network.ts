import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { StorageService } from "./storage";

export type NetworkListener = (isOnline: boolean) => void;

class NetworkMonitor {
  private isSimulatedOffline: boolean = false;
  private isPhysicalOnline: boolean = true;
  private listeners: Set<NetworkListener> = new Set();
  private unsubscribeNetInfo: (() => void) | null = null;
  private initialized: boolean = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      this.isSimulatedOffline = await StorageService.getSimulateOffline();
    } catch {
      this.isSimulatedOffline = false;
    }

    try {
      this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
        const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
        this.isPhysicalOnline = online;
        this.notifyListeners();
      });

      const current = await NetInfo.fetch();
      this.isPhysicalOnline = Boolean(current.isConnected && (current.isInternetReachable ?? true));
    } catch {
      this.isPhysicalOnline = true;
    }
    this.notifyListeners();
  }

  get isOnline(): boolean {
    if (this.isSimulatedOffline) {
      return false;
    }
    return this.isPhysicalOnline;
  }

  get isOfflineSimulated(): boolean {
    return this.isSimulatedOffline;
  }

  async setSimulateOffline(simulate: boolean): Promise<void> {
    this.isSimulatedOffline = simulate;
    await StorageService.setSimulateOffline(simulate);
    this.notifyListeners();
  }

  addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentOnline = this.isOnline;
    this.listeners.forEach((listener) => {
      try {
        listener(currentOnline);
      } catch (err) {
        console.error("[NetworkMonitor] listener error:", err);
      }
    });
  }

  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

export const networkMonitor = new NetworkMonitor();
