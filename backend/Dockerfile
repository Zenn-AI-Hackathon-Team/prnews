# Use the official Node.js 20 image.
FROM node:20-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you have native dependencies, you'll need to install build tools.
# RUN apt-get update && apt-get install -y build-essential
RUN npm install --omit=dev

# Copy local business logic and other files to the container.
COPY . .

# Build the application
RUN npm run build

# Run the web service on container startup.
CMD [ "npm", "start" ]
