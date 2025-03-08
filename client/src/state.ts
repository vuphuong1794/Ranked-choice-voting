import { proxy } from "valtio";

/*
proxy là một API của Valtio giúp tạo reactive state.
Khi giá trị của proxy thay đổi, các component React sử dụng nó sẽ tự động re-render.
*/
export enum AppPage {
    Welcome = "Welcome",
    Create = "Create",
    Join = "Join",
}

export type AppState = {
    currentPage: AppPage;
}

const state:AppState = proxy({
    currentPage: AppPage.Welcome //Ban đầu, currentPage được đặt là AppPage.Welcome
});

const actions = {
    setPage: (page: AppPage): void => {
        state.currentPage = page;
    },
    startOver: (): void => {
        actions.setPage(AppPage.Welcome); //Set currentPage là AppPage.Welcome;
    }
};

export { state, actions };