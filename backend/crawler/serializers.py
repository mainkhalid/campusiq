from rest_framework import serializers
from .models import CrawlSource, CrawlChunk


class CrawlChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CrawlChunk
        fields = ['id', 'content', 'page_url', 'page_title', 'metadata', 'created_at']


class CrawlSourceSerializer(serializers.ModelSerializer):
    chunk_count  = serializers.IntegerField(read_only=True)
    # Don't expose the embedding vectors in the list — too large
    class Meta:
        model  = CrawlSource
        fields = [
            'id', 'name', 'source_type', 'url', 'crawl_depth',
            'pdf_filename', 'active', 'status', 'error_message',
            'chunk_count', 'last_crawled', 'created_at',
        ]
        read_only_fields = [
            'status', 'error_message', 'chunk_count', 'last_crawled', 'created_at',
        ]


class CrawlSourceCreateSerializer(serializers.ModelSerializer):
    """Used for creation — accepts pdf_file upload."""
    pdf_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = CrawlSource
        fields = ['name', 'source_type', 'url', 'crawl_depth', 'pdf_file', 'active']

    def validate(self, data):
        source_type = data.get('source_type', 'website')
        if source_type in ('website', 'sitemap') and not data.get('url'):
            raise serializers.ValidationError({'url': 'URL is required for website/sitemap sources.'})
        if source_type == 'pdf' and not data.get('pdf_file'):
            raise serializers.ValidationError({'pdf_file': 'A PDF file is required.'})
        return data