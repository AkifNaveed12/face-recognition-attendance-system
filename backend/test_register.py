import os
from backend.register_student import register_student

# Resolve base directory (project root)
# Go up THREE levels to reach project root
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

# Build absolute image path
image_path = os.path.join(BASE_DIR, "test.jpg")

print("Image path:", image_path)


register_student(
    student_id="CS001",
    name="Test Student - Akif",
    department="Computer Science",
    image_path=image_path
)
