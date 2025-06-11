
export function Githublogin(){
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!
    const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI!

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:read `;
    window.location.href = githubAuthUrl;
}