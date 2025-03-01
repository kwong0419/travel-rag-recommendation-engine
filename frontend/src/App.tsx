import {ChakraProvider} from '@chakra-ui/react'
import TravelForm from './components/TravelForm'
import './App.css'

function App() {
  return (
    <ChakraProvider>
      <TravelForm />
    </ChakraProvider>
  )
}

export default App
