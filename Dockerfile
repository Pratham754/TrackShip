FROM node:16-alpine
# Set the working directory

WORKDIR /app
# Copy package.json and package-lock.json to the working directory  
COPY package*.json ./
# Install dependencies
RUN npm install 
# Copy the rest of the application code to the working directory
COPY . .
# Expose the port the app runs on
EXPOSE 3000
# Start the application 
CMD ["node", "app.js"]
