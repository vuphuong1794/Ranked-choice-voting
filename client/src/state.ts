import { Poll } from "shared/poll-types";
import { proxy } from "valtio";
import { derive, subscribeKey } from "valtio/utils";
import { getTokenPayload } from "./util";

/*
proxy là một API của Valtio giúp tạo reactive state.
Khi giá trị của proxy thay đổi, các component React sử dụng nó sẽ tự động re-render.
*/
export enum AppPage {
    Welcome = "Welcome",
    Create = "Create",
    Join = "Join",
    WaitingRoom = "WaitingRoom",
}

export type Me = {
    id: string;
    name: string;
};

export type AppState = {
    isLoading: boolean;
    me?: Me;
    currentPage: AppPage;
    poll?: Poll;
    accessToken?: string;
}

const state:AppState = proxy({
    isLoading: false,
    currentPage: AppPage.Welcome //Ban đầu, currentPage được đặt là AppPage.Welcome

});

const stateWithComputed: AppState = derive(
    {
        me: (get) => {
            const accessToken = get(state).accessToken;
      
            if (!accessToken) {
              return;
            }
      
            const token = getTokenPayload(accessToken);
      
            return {
              id: token.sub,
              name: token.name,
            };
        },
          isAdmin: (get) => {
            if (!get(state).me) {
              return false;
            }
            return get(state).me?.id === get(state).poll?.adminID;
        },
    },
    {
        proxy: state,
    }
)

const actions = {
    setPage: (page: AppPage): void => {
        state.currentPage = page;
    },
    startOver: (): void => {
        actions.setPage(AppPage.Welcome); //Set currentPage là AppPage.Welcome;
    },
    startLoading: (): void => {
        state.isLoading = true;
    },
    stopLoading: (): void => {
        state.isLoading = false;
    },
    initializePoll: (poll?: Poll): void => {
        state.poll = poll;
    },
    setPollAccessToken: (token?: string): void => {
        state.accessToken = token;
    },
};

//theo dõi sự thay đổi của accesstoken 
//nếu có accessToken và poll thì lưu vào localStorage, nếu không thì xóa khỏi localStorage
subscribeKey(stateWithComputed, 'accessToken', () => {
    if(state.accessToken && state.poll) {
        localStorage.setItem('accessToken', state.accessToken);
    } else {
        localStorage.removeItem('accessToken');
    }
});

export { stateWithComputed as state, actions };