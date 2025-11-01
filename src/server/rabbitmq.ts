import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  const conn = await amqp.connect("amqp://admin:admin@localhost:5672");
  channel = await conn.createChannel();
  console.log("RabbitMQ Server with port 5672 Connected");
};

export const getChannel = () => channel;



