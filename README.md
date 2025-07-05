<img src="https://github.com/user-attachments/assets/f6800391-def5-4234-95bc-97ed5f121730" alt="logo3d" width="80" style="vertical-align: middle;"/>
<h1>
 <strong>Skim</strong>
</h1>

A web-based video editing interface with timeline, drag-drop, and clip controls.


## 🎬 Demo
![Screenshot from 2025-07-05 00-12-50](https://github.com/user-attachments/assets/8da39255-9179-4474-8326-585e828f8a42)


## 🔗 Links

### 🎥 Skim Workflow Demo Video
https://youtu.be/bAuBT_yFQoM

### 🌐 Website Link
https://skim-alpha.vercel.app  

But it won't work since skim is pre-configured for local use, because production env will break and cause bad user experience follow [PRODUCTION DEPLOYMENT GUIDE](#-production-deployment-guide) if u still wish to.

### 🧠 My Thoughts
https://narendra8pal.hashnode.dev/skim-video-editor

<br />

## ✨ Features
- Timeline-based editor  
- Drag-and-drop clips  
- Volume & split controls  
- Zoom in/out  
- One-tap gap deletion between clips  

### 🚧 Coming Soon
- Export (download) edited video  
- Image media support  
- Transitions between clips  
- Fading effects  
- Clip duplication

<br />

## 🛠 Tech Stack
- **Frontend**: React + TypeScript + Next.js  
- **Backend**: NestJS + REST API  
- **Storage**: Cloudinary  
- **Database**: PostgreSQL  
- **Deployment**: Render  
- **Video Processing**: FFmpeg (for thumbnails)  


<br />

> ⚠️ **Warning:** Free tier hosting on render causes significantly slow performance and even cold starts.

<br />


# Deployment URLs
| Environment | Frontend URL            | Backend URL             |
| ----------- | ----------------------- | ----------------------- |
| Dev (Local) | `http://localhost:3000` | `http://localhost:3001` |
| Prod        | `https://skim-alpha.vercel.app`  | `https://skim-66sk.onrender.com`  |

<br />

> ⚠️ **IMPORTANT NOTICE**
>
> BY DEFAULT, THIS PROJECT IS MEANT TO RUN **LOCALLY** FOR A SMOOTH AND RICH EXPERIENCE.
>
> IF YOU DON'T CARE ABOUT LAG, COLD STARTS, OR PERFORMANCE ISSUES,  
> YOU CAN RUN IT IN PRODUCTION USING THE [PRODUCTION DEPLOYMENT GUIDE](#-production-deployment-guide).

<br />

> I would highly recommend using skim locally using the url provided for dev. Things aren't going to work perfect and smooth in production environment :(

<br />

# 🧑‍💻 Local Setup Instructions

```bash
git clone https://github.com/NarxPal/skim.git
cd skim
```

### Install Dependencies 

```bash
cd ./frontend
npm install
```

```bash
cd ../backend #if u are in frontend directory do this
#or
cd ./backend #if u are in skim directory do this
npm install
```

### Create environment files

Create a `.env` file in the root of both **frontend** and **backend** folders.

#### 🔧 Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

#### 🔧 Backend

> ⚠️ In `backend` directory i have already included `.env.example` file which contains temporary demo credentials. Please use responsibly.

<br />

> Run the following command and it will automatically copy the code of `.env.example` file and will create `.env` file.
```env
cp .env.example .env
```

### Run Locally

#### Frontend
```bash
npm run dev
```

#### Backend
```bash
npm run start:dev
```

# 🚀 PRODUCTION DEPLOYMENT GUIDE

> ⚠️ **NOTE**: Free-tier hosting (Render) will introduce cold starts and lag, believe me :(

### 🔧 BACKEND DEPLOYMENT (NestJS)

change origin in `main.ts` file:
```bash
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000', // frontend port
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
```

currently u will see `http://localhost:3000` change this to `https://skim-alpha.vercel.app`

also u have to uncomment psql db hosted environment variables in `.env` file and comment out environment variables running locally.

change backend port in `frontend` directory
<br />
change this:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

to this:
```env
NEXT_PUBLIC_API_BASE_URL=https://skim-66sk.onrender.com
```


