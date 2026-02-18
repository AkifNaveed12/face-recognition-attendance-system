from facenet_pytorch import MTCNN, InceptionResnetV1
import cv2
from PIL import Image
import torch

#Device (CPU is fine)

device ='cuda' if torch.cuda.is_available() else 'cpu'
print("using device :", device)


#load models
mtcnn = MTCNN(keep_all=True, device=device)
facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

#load image
img = cv2.imread('test.jpg')
rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
pill_img = Image.fromarray(img)

#detect faces
boxes, _ =mtcnn.detect(pill_img)

if boxes is not None:
    print(f"Faces detected : {len(boxes)}")
    
    #crop first face in the image
    face = mtcnn(pill_img) #already batched img all 4 dimentions present [batch_size, channels, height, width] <---FaceNets expected input shape
    embedding = facenet(face.to(device))
    
    print("Embedding Shape : ", embedding.shape)
    
else:
    print("No faces detected")