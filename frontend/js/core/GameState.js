export class GameState {
  constructor() {
    this.current = "hub";
    this.listeners = new Set();
  }

  set(current) {
    this.current = current;
    this.listeners.forEach((listener) => listener(current));
  }

  onChange(listener) {
    this.listeners.add(listener);
  }
}
