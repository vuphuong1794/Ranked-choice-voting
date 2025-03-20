import { Poll } from "shared/poll-types";
import { proxy } from "valtio";

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

export type AppState = {
    isLoading: boolean;
    currentPage: AppPage;
    poll?: Poll;
    accessToken?: string;
}

const state:AppState = proxy({
    isLoading: false,
    currentPage: AppPage.Welcome //Ban đầu, currentPage được đặt là AppPage.Welcome

});

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

export { state, actions };