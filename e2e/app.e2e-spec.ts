import { NgOgoPage } from './app.po';

describe('ng-ogo App', () => {
  let page: NgOgoPage;

  beforeEach(() => {
    page = new NgOgoPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
