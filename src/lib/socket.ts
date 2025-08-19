import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join room based on user role (this would be set after authentication)
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Handle work order updates
    socket.on('work-order-update', (data: { workOrderId: string; status: string; userId: string }) => {
      // Broadcast to all clients in the same room
      socket.to('managers').emit('work-order-updated', {
        workOrderId: data.workOrderId,
        status: data.status,
        updatedBy: data.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle new work orders
    socket.on('new-work-order', (data: { workOrder: any; userId: string }) => {
      // Notify all managers about new work order
      socket.to('managers').emit('work-order-created', {
        workOrder: data.workOrder,
        createdBy: data.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle PPM schedule updates
    socket.on('ppm-schedule-update', (data: { scheduleId: string; action: string; userId: string }) => {
      socket.to('technicians').emit('ppm-schedule-updated', {
        scheduleId: data.scheduleId,
        action: data.action,
        updatedBy: data.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle safety incidents
    socket.on('safety-incident', (data: { incident: any; userId: string }) => {
      // Notify all managers about safety incidents
      socket.to('managers').emit('safety-incident-reported', {
        incident: data.incident,
        reportedBy: data.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle chat messages
    socket.on('message', (msg: { text: string; senderId: string; room?: string }) => {
      const messageData = {
        text: msg.text,
        senderId: msg.senderId,
        timestamp: new Date().toISOString(),
      };

      if (msg.room) {
        // Send to specific room
        io.to(msg.room).emit('message', messageData);
      } else {
        // Broadcast to all connected clients
        io.emit('message', messageData);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Connected to Facilities Management System',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};