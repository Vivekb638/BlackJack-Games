
import random

MainBalance = 1000 

def user(value):
    UserValue = random.randint(2, 11) 
    print("UserSum: ", value + UserValue) 
    return UserValue

def System(value):
    SystemValue = random.randint(2, 11)  
    print("System Sum: ", value + SystemValue)
    return SystemValue

def Account(balance, result):
    global MainBalance  
    if result == "win":
        MainBalance += balance
    elif result == "lose":
        MainBalance -= balance
    return MainBalance

while True:
    x = input("Do you want to start the game? (Y/N): ").strip().lower()
    print("Your balance:", MainBalance)

    if x == "y" and MainBalance > 0:
        inputData = int(input("Enter the Money: "))
        
        if inputData > MainBalance:
            print("You don't have enough balance!")
            continue

        sumClient = 0
        sumServer = 0
        flag = 0

        while True:
            userInput = input("Do you want to draw a number? (Y to continue, N to stop): ").strip().lower()
            
            if userInput == 'n':  
                if sumClient < 16:
                    print("Minimum sum value should be 16. You must draw another card.")
                    sumClient += user(sumClient)
                elif sumServer > 21:
                    flag = 1
                    break
                elif 16 <= sumClient < 21:
                    if sumClient > sumServer:
                        flag = 1  # User wins
                        break
                    elif sumClient == 21:
                        print("You won by blackjack!")
                        flag = 1
                        break
                    elif sumClient == sumServer:
                        flag = 2  
                        break
                    else:
                        flag = 0  
                        break
                elif sumClient > 21:
                    flag = 0  
                    break
                elif sumClient == 21:
                    print("You won by blackjack!")
                    flag = 1
                    break
                
                sumServer += System(sumServer) 

            else:  
                sumClient += user(sumClient)
                if sumClient > 21:
                    flag = 0  
                    break
                elif sumServer > 21:
                    flag = 1
                    break
                
                sumServer += System(sumServer) 

        # print("Final System Sum:", sumServer)

        if flag == 0:
            print("You lost the game!")
            new_balance = Account(inputData, "lose")
        elif flag == 1:
            print("You won the game!")
            new_balance = Account(inputData, "win")
        else:
            print("It's a draw!")
            new_balance = MainBalance  
        
        print("Your available balance is:", new_balance)

    else:
        print("Thank you for playing the game!")
        break
           

            

          





    
    

           


            
    


