FROM node:20

# Set the working directory inside the container
WORKDIR /app 

COPY package*.json ./ 

RUN npm install 

COPY . .  

# Compile TypeScript to JavaScript
RUN npm run build 

EXPOSE 3000 

# Command to start the application
CMD ["npm","start"]