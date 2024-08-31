import { account, appwriteConfig, avatars, databases, storage } from "./config";
import { ID, Query } from "appwrite";

export async function createUserAccount(user) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )

        if (!newAccount) throw Error

        const avatarUrl = avatars.getInitials(user.name)

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            email: newAccount.email,
            name: newAccount.name,
            username: user.username,
            imageUrl: avatarUrl
        })

        return newUser


    } catch (error) {
        console.log(error);
        return error;
    }
}

export async function saveUserToDB(user) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user
        )

        return newUser;
    } catch (error) {
        console.log(error);
    }
}

export async function signInAccount(user) {
    try {
        const session = await account.createEmailPasswordSession(user.email, user.password)

        return session
    } catch (error) {
        console.log(error);
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get()

        if (!currentAccount) throw Error

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if (!currentUser) throw Error

        return currentUser.documents[0];

    } catch (error) {
        console.log(error);
    }
}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current");

        return session;
    } catch (error) {
        console.log(error);
    }
}

export async function createPost(post) {
    try {
        //upload img to storage
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw Error

        const fileUrl = getFilePreview(uploadedFile.$id)

        if (!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw Error
        }

        const tags = post.tags?.trim().split(/\s*,\s*/) || [];

        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        )

        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }

        return newPost

    } catch (error) {
        console.log(error);
    }
}

export async function uploadFile(file) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );
        return uploadedFile
    } catch (error) {
        console.log(error);
    }
}

export function getFilePreview(fileId) {
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            "top",
            100
        );

        if (!fileUrl) throw Error;

        return fileUrl
    } catch (error) {
        console.log(error);
    }
}

export async function deleteFile(fileId) {
    try {
        await storage.deleteFile(
            appwriteConfig.storageId,
            fileId
        );
        return { status: 'ok' }
    } catch (error) {
        console.log(error);
    }
}

export async function getRecentPosts() {
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
    )

    if (!posts) throw Error;

    return posts;
}

export async function likePost(postId, likesArray) {
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
            {
                likes: likesArray,
            }
        );

        if (!updatedPost) throw new Error('Failed to update post');

        return updatedPost;
    } catch (error) {
        console.log(error);
    }
}


export async function savePost(userId, postId) {
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                user: userId,
                post: postId
            }
        )

        if (!updatedPost) throw Error

        return updatedPost
    } catch (error) {
        console.log(error);
    }
}

export async function deleteSavedPost(savedRecordId) {
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            savedRecordId,
        )

        if (!statusCode) throw Error

        return { message: "removed from saves." }
    } catch (error) {
        console.log(error);
    }
}

export async function getPostById(postId) {
    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )

        return post
    } catch (error) {
        console.log(error);
    }
}

export async function editPost(post) {
    const hasFileToUpdate = post.file.length > 0
    try {

        let image = {
            imageUrl: post.imageurl,
            imageId: post.imageId
        }
        //upload img to storage
        if (hasFileToUpdate) {

            await deleteFile(image.imageId)

            const uploadedFile = await uploadFile(post.file[0]);

            if (!uploadedFile) throw Error

            const fileUrl = getFilePreview(uploadedFile.$id)

            if (!fileUrl) {
                deleteFile(uploadedFile.$id)
                throw Error
            }

            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
        }

        const tags = post.tags?.trim().split(/\s*,\s*/) || [];

        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            post.postId,
            {
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
                location: post.location,
                tags: tags
            }
        )

        if (!updatedPost) {
            await deleteFile(image.imageId)
            throw Error
        }

        return updatedPost

    } catch (error) {
        console.log(error);
    }
}

export async function deletePost(postId, imageId) {
    if (!postId || !imageId) return;

    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        );

        if (!statusCode) throw Error;

        await deleteFile(imageId);

        return { status: "Ok" };
    } catch (error) {
        console.log(error);
    }
}

export async function getInfinitePosts(pageParam) {
    const queries = [
        Query.orderDesc('$updatedAt'),
        Query.limit(6)
    ];
    if (pageParam.pageParam) {
        queries.push(Query.cursorAfter(pageParam.pageParam))
    }

    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            queries
        );

        if (!posts) throw new Error('No posts found');

        return posts;
    } catch (error) {
        console.error(error);
    }
}

export async function searchPosts(searchTerm) {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.search('caption', searchTerm)]
        )

        if (!posts) throw Error;

        return posts;
    } catch (error) {
        console.log(error);
    }
}

export async function getUsers(limit) {
    const queries = [Query.orderDesc("$createdAt")];

    if (limit) {
        queries.push(Query.limit(limit));
    }

    try {
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            queries
        );

        if (!users) throw Error;

        return users;
    } catch (error) {
        console.log(error);
    }
}

export async function getUserById(userId) {
    try {
        const user = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userId
        );

        if (!user) throw Error;

        return user;
    } catch (error) {
        console.log(error);
    }
}

export async function updateUser(user) {
    const hasFileToUpdate = user.file.length > 0;
    try {
        let image = {
            imageUrl: user.imageUrl,
            imageId: user.imageId,
        };

        if (hasFileToUpdate) {
            // Upload new file to appwrite storage
            const uploadedFile = await uploadFile(user.file[0]);
            if (!uploadedFile) throw Error;

            // Get new file url
            const fileUrl = getFilePreview(uploadedFile.$id);
            if (!fileUrl) {
                await deleteFile(uploadedFile.$id);
                throw Error;
            }
            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
        }

        //  Update user
        const updatedUser = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            user.userId,
            {
                name: user.name,
                bio: user.bio,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
            }
        );

        // Failed to update
        if (!updatedUser) {
            // Delete new file that has been recently uploaded
            if (hasFileToUpdate) {
                await deleteFile(image.imageId);
            }
            // If no new file uploaded, just throw error
            throw Error;
        }

        // Safely delete old file after successful update
        if (user.imageId && hasFileToUpdate) {
            await deleteFile(user.imageId);
        }

        return updatedUser;
    } catch (error) {
        console.log(error);
    }
}

export async function getUserPosts(userId) {
    if (!userId) return;

    try {
        const post = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
        );

        if (!post) throw Error;

        return post;
    } catch (error) {
        console.log(error);
    }
}

export async function followUser(followerId, followingId) {
    try {
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.followsCollectionId,
            ID.unique(),
            {
                followerId: followerId,
                followingId: followingId,
            }
        );
    } catch (error) {
        console.error('Error following user:', error);
    }
};

export async function unfollowUser(followerId, followingId) {
    try {
        const documents = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.followsCollectionId,
            [Query.equal('followerId', followerId), Query.equal('followingId', followingId)]
        );

        if (documents.documents.length > 0) {
            const documentId = documents.documents[0].$id;
            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.followsCollectionId,
                documentId
            );
        }
    } catch (error) {
        console.error('Error unfollowing user:', error);
    }
};

export async function getTotalFollowers(userId) {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.followsCollectionId,
            [Query.equal('followingId',userId)]
        );;
        return response.total;
    } catch (error) {
        console.error('Error fetching total followers:', error);
        return 0;
    }
};

export async function getTotalFollowing(userId) {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.followsCollectionId,
            [Query.equal('followerId', [userId])]
        );
        return response.total;
    } catch (error) {
        console.error('Error fetching total following:', error);
        return 0;
    }
};

export async function getFollowingStatus(followerId, followingId) {
    try {
        const documents = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.followsCollectionId,
            [Query.equal('followerId', followerId), Query.equal('followingId', followingId)]
        );

        if (documents.documents.length > 0) {
           return true;
        }

        return false;
    } catch (error) {
        console.log(error);
    }
}
