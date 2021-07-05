deploy: update build start

update:
	git pull

build:
	docker-compose build --pull

start:
	docker-compose up -d