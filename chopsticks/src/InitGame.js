import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from './socket';

export default function InitGame({setRoom, setOrientation, setPlayers}) {
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [roomInput, setRoomInput] = useState("");
    const [roomError, setRoomError] = useState("");

    return (
        <Stack
            justifyContent="center"
            alignItems="center"
            sx={{py: 1, height: "100vh"}}
        >
            <CustomDialog
                open={roomDialogOpen}
                handleClose={() => setRoomDialogOpen(false)}
                title="Select Room to Join"
                contextText="Enter a valid room ID to join the room"
                handleContinue={() => {
                    // handle joining a room
                    if(!roomInput) return;
                    socket.emit("joinRoom", {roomId: roomInput}, (r) => {
                        // r is the response from the server
                        if(r.error) return setRoomError(r.message);
                        console.log("response:", r);
                        setRoom(r?.roomId); // the question mark is a null check (if null, would not return a type error, but would return undefined)
                        setPlayers(r?.players);
                        setOrientation("two");
                        setRoomDialogOpen(false);
                    });
                }}
            >
                <TextField
                    autoFocus
                    margin="dense"
                    id="room"
                    label="Room ID"
                    name="room"
                    value={roomInput}
                    required
                    onChange={(e) => setRoomInput(e.target.value)}
                    type="text"
                    fullWidth
                    variant="standard"
                    error={Boolean(roomError)}
                    helperText={!roomError ? 'Enter a Room ID' : `Invalid Room ID ${roomInput}`}
                />
            </CustomDialog>
            {/* Button to Start Game */}
            <Button
                variant="contained"
                onClick={() => {
                    socket.emit("createRoom", (r) => {
                        console.log(r);
                        setRoom(r);
                        setOrientation("one");
                    })
                }}
            >
                Start Game
            </Button>
            {/* Button to Join a Game */}
            <Button
                onClick={() => {
                    setRoomDialogOpen(true);
                }}
            >
                Join Game
            </Button>
        </Stack>
    )
}