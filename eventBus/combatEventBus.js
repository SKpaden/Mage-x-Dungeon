export class CombatEventBus {
    constructor(){
        this.listeners = {};  // all listeners register here
    }

    /**
     * Registers a new event listener to the event bus.
     * @param {String} eventName The event name
     * @param {Function} handler The event callback
     */
    on(eventName, handler){
        if (!this.listeners[eventName]) this.listeners[eventName] = [handler];
        else {
            this.listeners[eventName].push(handler);
        }
    }

    /**
     * Emits an event and executes all registered handlers.
     * @param {String} eventName The event name
     * @param {Object} payload The necessary data for the handler execution
     */
    async emit(eventName, payload){
        const handlers = this.listeners[eventName] || [];
        for (const handler of handlers) await handler(payload);
    }
}