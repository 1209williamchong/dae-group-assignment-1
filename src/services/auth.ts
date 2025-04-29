interface User {
    id: string;
    username: string;
    email: string;
    password: string;
}

interface Like {
    like_id: number;
    post_id: number;
    user_id: string;
}

interface Follow {
    follow_id: number;
    follower_id: string;
    followed_id: string;
}

class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private users: User[] = [];
    private likes: Like[] = [];
    private follows: Follow[] = [];

    private constructor() {
        // 從 localStorage 載入已註冊的用戶
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
        }

        // 從 localStorage 載入當前登入狀態
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }

        // 從 localStorage 載入按讚記錄
        const savedLikes = localStorage.getItem('likes');
        if (savedLikes) {
            this.likes = JSON.parse(savedLikes);
        }

        // 從 localStorage 載入關注記錄
        const savedFollows = localStorage.getItem('follows');
        if (savedFollows) {
            this.follows = JSON.parse(savedFollows);
        }
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async register(username: string, email: string, password: string): Promise<boolean> {
        // 檢查用戶名是否已存在
        if (this.users.some(user => user.username === username)) {
            throw new Error('用戶名已存在');
        }

        // 檢查電子郵件是否已存在
        if (this.users.some(user => user.email === email)) {
            throw new Error('電子郵件已被使用');
        }

        // 創建新用戶
        const newUser: User = {
            id: Date.now().toString(),
            username,
            email,
            password
        };

        this.users.push(newUser);
        this.saveUsers();
        return true;
    }

    public async login(username: string, password: string): Promise<boolean> {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (!user) {
            throw new Error('用戶名或密碼錯誤');
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }

    public logout(): void {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    public isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    // 按讚相關方法
    public async toggleLike(postId: number): Promise<boolean> {
        if (!this.currentUser) {
            throw new Error('請先登入');
        }

        const existingLike = this.likes.find(
            like => like.post_id === postId && like.user_id === this.currentUser!.id
        );

        if (existingLike) {
            // 取消按讚
            this.likes = this.likes.filter(like => like.like_id !== existingLike.like_id);
        } else {
            // 新增按讚
            const newLike: Like = {
                like_id: Date.now(),
                post_id: postId,
                user_id: this.currentUser.id
            };
            this.likes.push(newLike);
        }

        this.saveLikes();
        return !existingLike;
    }

    public async getPostLikes(postId: number): Promise<number> {
        return this.likes.filter(like => like.post_id === postId).length;
    }

    public async hasUserLiked(postId: number): Promise<boolean> {
        if (!this.currentUser) return false;
        return this.likes.some(
            like => like.post_id === postId && like.user_id === this.currentUser!.id
        );
    }

    // 關注相關方法
    public async toggleFollow(followedId: string): Promise<boolean> {
        if (!this.currentUser) {
            throw new Error('請先登入');
        }

        if (this.currentUser.id === followedId) {
            throw new Error('不能關注自己');
        }

        const existingFollow = this.follows.find(
            follow => follow.follower_id === this.currentUser!.id && follow.followed_id === followedId
        );

        if (existingFollow) {
            // 取消關注
            this.follows = this.follows.filter(follow => follow.follow_id !== existingFollow.follow_id);
        } else {
            // 新增關注
            const newFollow: Follow = {
                follow_id: Date.now(),
                follower_id: this.currentUser.id,
                followed_id: followedId
            };
            this.follows.push(newFollow);
        }

        this.saveFollows();
        return !existingFollow;
    }

    public async getFollowers(userId: string): Promise<User[]> {
        const followerIds = this.follows
            .filter(follow => follow.followed_id === userId)
            .map(follow => follow.follower_id);
        
        return this.users.filter(user => followerIds.includes(user.id));
    }

    public async getFollowing(userId: string): Promise<User[]> {
        const followingIds = this.follows
            .filter(follow => follow.follower_id === userId)
            .map(follow => follow.followed_id);
        
        return this.users.filter(user => followingIds.includes(user.id));
    }

    public async isFollowing(userId: string): Promise<boolean> {
        if (!this.currentUser) return false;
        return this.follows.some(
            follow => follow.follower_id === this.currentUser!.id && follow.followed_id === userId
        );
    }

    private saveUsers(): void {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    private saveLikes(): void {
        localStorage.setItem('likes', JSON.stringify(this.likes));
    }

    private saveFollows(): void {
        localStorage.setItem('follows', JSON.stringify(this.follows));
    }
}

export const authService = AuthService.getInstance(); 