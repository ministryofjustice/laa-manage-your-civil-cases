IMAGE := ghcr.io/ministryofjustice/tech-docs-github-pages-publisher:v6.0.1

# Use this to run a local instance of the documentation site, while editing
.PHONY: preview check

preview:
	docker run --rm \
		-v $$(pwd)/config:/tech-docs-github-pages-publisher/config \
		-v $$(pwd)/source:/tech-docs-github-pages-publisher/source \
		-p 4567:4567 \
		-it $(IMAGE) /usr/local/bin/preview

deploy:
	docker run --rm \
		-v $$(pwd)/config:/tech-docs-github-pages-publisher/config \
		-v $$(pwd)/source:/tech-docs-github-pages-publisher/source \
		-it $(IMAGE) /usr/local/bin/package

check:
	docker run --rm \
		-v $$(pwd)/config:/tech-docs-github-pages-publisher/config \
		-v $$(pwd)/source:/tech-docs-github-pages-publisher/source \
		-it $(IMAGE) /usr/local/bin/check-url-links