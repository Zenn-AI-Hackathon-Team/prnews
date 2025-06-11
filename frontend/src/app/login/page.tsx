'use client';
import { LoginForm } from "@/components/ui/loginform";
import { Githublogin } from "@/lib/auth/login";

export default function Home() {
    const handlegithublogin = async()=>{
        try{
            await Githublogin();
        }catch(e){
            console.log(e);
        }
    }
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm className="w-full" onGithubLogin={handlegithublogin}/>
            </div>
        </div>
    );
}
