FROM node:16.19.0
WORKDIR /
RUN apt-get update && \
    apt-get install -y python3-pip && \
    ln -sf /usr/bin/pip3 /usr/bin/pip
COPY package.json yarn.lock /
RUN yarn install --frozen-lockfile
COPY . /
EXPOSE 8080
CMD [ "yarn", "start" ]