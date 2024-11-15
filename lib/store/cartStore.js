import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const MAX_ITEMS = 50; // Reasonable limit to prevent storage issues

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                try {
                    const items = get().items;
                    const existingItem = items.find((i) => i._id === item._id);

                    if (!existingItem) {
                        // Check if adding another item would exceed the limit
                        if (items.length >= MAX_ITEMS) {
                            console.warn('Cart has reached maximum capacity');
                            throw new Error('Cart is full');
                        }

                        set({ items: [...items, item] });
                    }
                } catch (error) {
                    // Handle storage quota exceeded error
                    if (error.name === 'QuotaExceededError') {
                        console.error('Storage quota exceeded. Trying to free up space...');
                        // Remove oldest items if needed
                        const items = get().items;
                        if (items.length > 0) {
                            set({ items: items.slice(-Math.floor(items.length / 2)) });
                            // Try adding the item again
                            set({ items: [...get().items, item] });
                        }
                    }
                    throw error; // Re-throw other errors
                }
            },
            removeItem: (itemId) => {
                try {
                    set({ items: get().items.filter((item) => item._id !== itemId) });
                } catch (error) {
                    console.error('Error removing item from cart:', error);
                    throw error;
                }
            },
            clearCart: () => {
                try {
                    set({ items: [] });
                } catch (error) {
                    console.error('Error clearing cart:', error);
                    throw error;
                }
            },
            getTotalAmount: () => {
                try {
                    return get().items.reduce((total, item) => total + item.price, 0);
                } catch (error) {
                    console.error('Error calculating total amount:', error);
                    return 0;
                }
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => {
                // Custom storage wrapper with error handling
                const storage = window.localStorage;
                return {
                    getItem: (name) => {
                        try {
                            return storage.getItem(name);
                        } catch (error) {
                            console.error('Error reading from storage:', error);
                            return null;
                        }
                    },
                    setItem: (name, value) => {
                        try {
                            storage.setItem(name, value);
                        } catch (error) {
                            console.error('Error writing to storage:', error);
                            throw error;
                        }
                    },
                    removeItem: (name) => {
                        try {
                            storage.removeItem(name);
                        } catch (error) {
                            console.error('Error removing from storage:', error);
                            throw error;
                        }
                    },
                };
            }),
            // Add partialize to only store essential data
            partialize: (state) => ({
                items: state.items.map(item => ({
                    _id: item._id,
                    price: item.price,
                    // Add other essential fields you need to persist
                }))
            }),
        }
    )
);

export default useCartStore;