import Stripe from "stripe";
import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

/**
 * Retrieves all orders for the current user.
 *
 * The response will contain an array of order objects, each with their
 * respective restaurant and user populated.
 *
 * If any error occurs, a 500 status will be returned with a message
 * "something went wrong".
 */
const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("restaurant")
      .populate("user");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

type CheckoutSessionRequest = {
  cartItems: {
    menuItemId: string;
    name: string;
    quantity: string;
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine1: string;
    city: string;
  };
  restaurantId: string;
};

/**
 * Handles incoming Stripe webhook events.
 * When a checkout session is completed, updates the corresponding order in the database.
 * Responds with a 200 status to Stripe.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
const stripeWebhookHandler = async (req: Request, res: Response) => {
 
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = STRIPE.webhooks.constructEvent(
      req.body,
      sig as string,
      STRIPE_ENDPOINT_SECRET
    );
  } catch (error: any) {
    console.log(error);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const order = await Order.findById(event.data.object.metadata?.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.totalAmount = event.data.object.amount_total;
    order.status = "paid";

    await order.save();
  }

  res.status(200).send();
};

/**
 * Creates a Stripe checkout session and saves the order to the database.
 * @param {Request} req - Request object containing the checkout session request in the body.
 * @param {Response} res - Response object.
 * @returns {Promise<void>}
 * @throws {Error} If the restaurant is not found or there is an error creating the stripe session.
 */
const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;

    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    );

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const newOrder = new Order({
      restaurant: restaurant,
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      createdAt: new Date(),
    });

    const lineItems = createLineItems(//creates line items for stripe from our cart items' array
      checkoutSessionRequest,
      restaurant.menuItems
    );//this will be the body of our request to stripe

    const session = await createSession(
      lineItems,
      newOrder._id.toString(),
      restaurant.deliveryPrice,
      restaurant._id.toString()
    );

    if (!session.url) {
      return res.status(500).json({ message: "Error creating stripe session" });
    }

    await newOrder.save();//commit to db
    res.json({ url: session.url });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.raw.message });
  }
};

  /**
   * Creates an array of Stripe Checkout session line items from the given cart items and menu items.
   * @param {CheckoutSessionRequest} checkoutSessionRequest The request to create a checkout session.
   * @param {MenuItemType[]} menuItems The list of menu items for the restaurant.
   * @returns {Stripe.Checkout.SessionCreateParams.LineItem[]} The list of line items for the checkout session.
   */
const createLineItems = (
  checkoutSessionRequest: CheckoutSessionRequest,
  menuItems: MenuItemType[]
) => {
  const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
    const menuItem = menuItems.find(
      (item) => item._id.toString() === cartItem.menuItemId.toString()
    );
    if (!menuItem) {
      throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
    }

    const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "dzd",
        unit_amount: menuItem.price*100,
        product_data: {
          name: menuItem.name,
        },
      },
      quantity: parseInt(cartItem.quantity),
    };

    return line_item;
  });

  return lineItems;
};

  /**
   * Creates a Stripe Checkout session for the given line items and order details.
   * The session is configured to use the "payment" mode and includes the order ID and restaurant ID as metadata.
   * The session is also configured to redirect to the order status page on success or cancellation.
   * @param {Stripe.Checkout.SessionCreateParams.LineItem[]} lineItems The list of line items for the checkout session.
   * @param {string} orderId The ID of the order.
   * @param {number} deliveryPrice The price of delivery.
   * @param {string} restaurantId The ID of the restaurant.
   * @returns {Promise<Stripe.Checkout.Session>} The created checkout session.
   */
const createSession = async (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  orderId: string,
  deliveryPrice: number,
  restaurantId: string
) => {
  const sessionData = await STRIPE.checkout.sessions.create({
    line_items: lineItems,
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice*100,
            currency: "dzd",
          },
        },
      },
    ],
    mode: "payment",
    metadata: {
      orderId,
      restaurantId,
    },
    success_url: `${FRONTEND_URL}/order-status?success=true`,
    cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
  });

  return sessionData;
};

export default {
  getMyOrders,
  createCheckoutSession,
  stripeWebhookHandler,
};
