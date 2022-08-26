/**
 * @jest-environment jsdom
 */


import NewBill from "../containers/NewBill.js"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom/extend-expect'
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {

  describe("When I am on NewBills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      
      //Create page
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      //Searching for the tested element
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      
      //Icon is hilighted if div contain "activ-icon" class
      expect(mailIcon.classList.contains('active-icon')).toBeTruthy();
    })
  })

  describe("When I am on NewBills Page and upload a file", () => {
    test('Then wrong file format should be detected', () => {
      //Create page
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      
      const newBillPage = new NewBill({ document, onNavigate, store: mockStore, bills:bills, localStorage: window.localStorage })
      
      const handleChangeFile = jest.fn((e) => newBillPage.handleChangeFile(e))
      const isFileImage = jest.fn((file) => newBillPage.isFileImage(file))
      const file = new File(['billFile'], 'billFile.pdf', {type: 'document/pdf'});
      const inputFile = screen.getByTestId('file');

      inputFile.addEventListener('change', handleChangeFile);
      fireEvent.change(inputFile, { target: {files: [file]}});

      expect(isFileImage(file)).not.toBe(true)
      expect(screen.getByText('Veuillez sélectionner un fichier image (.jpeg, .jpg ou .png)')).toBeTruthy();
    })
  })
})

// Tests d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When an error occurs on POST API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches messages from POST API and fails with error at submit button", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update : () =>  {
            return Promise.reject(new Error("Erreur"))
          }
        }})

      window.onNavigate(ROUTES_PATH.NewBill)

      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})

      //Define jest function
      console.error = jest.fn();
      
      // Submit form
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)

      fireEvent.submit(form)
      await new Promise(process.nextTick)

      expect(console.error).toBeCalled()
    })
  })
})