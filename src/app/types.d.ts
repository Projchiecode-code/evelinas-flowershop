export interface Bouquet {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    occasion: string[];
    popularity: number;
    inStock: boolean;
    flowers: string[];
}
export interface CartItem {
    bouquet: Bouquet;
    quantity: number;
    customMessage?: string;
    deliveryDate?: string;
}
export type PaymentMethod = 'cod' | 'e-wallet' | 'bank-transfer';
export interface Order {
    id: string;
    items: CartItem[];
    total: number;
    status: OrderStatus;
    customerName: string;
    deliveryAddress: string;
    phone: string;
    email: string;
    createdAt: Date;
    estimatedDelivery: Date;
    trackingUpdates: TrackingUpdate[];
    rating?: number;
    ratingComment?: string;
    paymentMethod?: PaymentMethod;
    paymentProof?: string;
}
export type OrderStatus = 'to-pay' | 'to-ship' | 'to-receive' | 'to-rate' | 'rated' | 'cancelled';
export interface TrackingUpdate {
    status: OrderStatus;
    timestamp: Date;
    message: string;
    location?: string;
}
export interface UserPreferences {
    favoriteColors: string[];
    occasions: string[];
    priceRange: [number, number];
    preferredFlowers: string[];
}
export interface Review {
    id: string;
    bouquetId: string;
    orderId?: string;
    customerName: string;
    customerEmail?: string;
    rating: number;
    comment: string;
    photos?: string[];
    createdAt: Date;
    approved: boolean;
    featured?: boolean;
}
export interface GalleryPhoto {
    id: string;
    bouquetId?: string;
    bouquetName?: string;
    customerName: string;
    imageUrl: string;
    caption: string;
    approved: boolean;
    featured: boolean;
    createdAt: Date;
    likes: number;
}
export interface AIRule {
    id: string;
    name: string;
    description: string;
    conditions: {
        field: string;
        operator: string;
        value: string;
    }[];
    action: {
        type: 'boost' | 'filter' | 'tag';
        value: string | number;
    };
    active: boolean;
    priority: number;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    trigger: string;
    subject: string;
    body: string;
    active: boolean;
}
export interface NotificationLog {
    id: string;
    templateId?: string;
    subject: string;
    recipient: string;
    sentAt: Date;
    status: 'sent' | 'failed';
    type: 'auto' | 'manual';
}
export interface GalleryComment {
    id: string;
    photoId: string;
    authorName: string;
    text: string;
    createdAt: Date;
    approved: boolean;
}
export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'review' | 'promo' | 'system';
    read: boolean;
    createdAt: Date;
    link?: string;
}
//# sourceMappingURL=types.d.ts.map