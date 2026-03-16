import { format } from "date-fns";

type NotifyInput = {
  toEmail?: string;
  toPhone?: string;
  customerName: string;
  serviceName: string;
  barberName: string;
  date: string;
  startTime: string;
};

function bookingMessage(input: NotifyInput) {
  const d = new Date(`${input.date}T${input.startTime}`);
  const when = format(d, "EEE, MMM d 'at' h:mm a");
  return `Hi ${input.customerName}, your ${input.serviceName} with ${input.barberName} is confirmed for ${when}. Reply to reschedule if needed.`;
}

export async function sendBookingEmail(input: NotifyInput) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM || !input.toEmail) return;

  const text = bookingMessage(input);
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [input.toEmail],
      subject: `Booking Confirmed — ${input.serviceName}`,
      text
    })
  });
}

export async function sendSms(input: NotifyInput, purpose: "confirmation" | "reminder" | "review" | "rebook") {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM ||
    !input.toPhone
  ) {
    return;
  }

  const base = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const bodyMessage =
    purpose === "review"
      ? `Thanks for visiting YOH Cuts Studio, ${input.customerName}. If you liked your cut, we'd appreciate a review: ${process.env.REVIEW_LINK ?? "https://g.page/r/demo/review"}`
      : purpose === "rebook"
        ? `Hey ${input.customerName}, it might be time for your next ${input.serviceName}. Rebook in 20 sec: ${process.env.BOOKING_URL ?? "https://example.com/book"}`
        : bookingMessage(input);

  const form = new URLSearchParams({
    To: input.toPhone,
    From: process.env.TWILIO_FROM,
    Body: bodyMessage
  });

  await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
}
