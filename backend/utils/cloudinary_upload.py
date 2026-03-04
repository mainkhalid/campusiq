import cloudinary
import cloudinary.uploader
from decouple import config

cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME'),
    api_key=config('CLOUDINARY_API_KEY'),
    api_secret=config('CLOUDINARY_API_SECRET'),
)


def upload_to_cloudinary(file_obj, folder='uploads', max_width=1200,
                          max_height=800, fmt='jpg', quality='auto:good'):
    """
    Python port of uploadToCloudinary() from cloudinaryUpload.js.
    Accepts a Django InMemoryUploadedFile (from request.FILES).
    Returns a dict matching your Node version's shape.
    """
    result = cloudinary.uploader.upload(
        file_obj,
        folder=folder,
        resource_type='image',
        quality=quality,
        format=fmt,
        transformation=[{
            'width': max_width,
            'height': max_height,
            'crop': 'limit'
        }]
    )
    return {
        'url': result['secure_url'],
        'public_id': result['public_id'],
        'width': result['width'],
        'height': result['height'],
        'format': result['format'],
        'bytes': result['bytes'],
    }


def delete_from_cloudinary(public_id):
    """
    Python port of deleteFromCloudinary() from cloudinaryUpload.js.
    Called before deleting a record that has a thumbnail.
    """
    try:
        return cloudinary.uploader.destroy(public_id)
    except Exception as e:
        raise Exception(f'Failed to delete image: {str(e)}')