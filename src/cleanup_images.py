from os import path, remove
from glob import glob

def remove_images(directory_path):
    files = glob(path.join(directory_path, "*"))
    [remove(file) for file in files if path.isfile(file)]

image_directory = "src/static/generated-images/"
remove_images(image_directory)
