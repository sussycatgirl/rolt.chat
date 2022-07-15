import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { User, API } from "revolt.js";
import styled from "styled-components/macro";

import { Ref } from "preact";
import { Text } from "preact-i18n";

import { internalEmit } from "../../../lib/eventEmitter";

import { useClient } from "../../../controllers/client/ClientController";
import { modalController } from "../../../controllers/modals/ModalController";
import UserIcon from "./UserIcon";

const BotBadge = styled.div`
    display: inline-block;
    flex-shrink: 0;
    height: 1.4em;
    padding: 0 4px;
    font-size: 0.6em;
    user-select: none;
    margin-inline-start: 4px;
    text-transform: uppercase;
    color: var(--accent-contrast);
    background: var(--accent);
    border-radius: calc(var(--border-radius) / 2);
`;

type UsernameProps = Omit<
    JSX.HTMLAttributes<HTMLElement>,
    "children" | "as"
> & {
    user?: User;
    prefixAt?: boolean;
    masquerade?: API.Masquerade;
    showServerIdentity?: boolean | "both";

    innerRef?: Ref<any>;
};

const Name = styled.span<{ colour?: string | null }>`
    background: ${(props) => props.colour ?? "var(--foreground)"};
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

export const Username = observer(
    ({
        user,
        prefixAt,
        masquerade,
        showServerIdentity,
        innerRef,
        ...otherProps
    }: UsernameProps) => {
        let username = user?.username;
        let color;

        if (user && showServerIdentity) {
            const { server } = useParams<{ server?: string }>();
            if (server) {
                const client = useClient();
                const member = client.members.getKey({
                    server,
                    user: user._id,
                });

                if (member) {
                    if (member.nickname) {
                        if (showServerIdentity === "both") {
                            username = `${member.nickname} (${username})`;
                        } else {
                            username = member.nickname;
                        }
                    }

                    const role = member.hoistedRole;
                    if (role) {
                        color = role[1].colour;
                    }

                    if (member.roles && member.roles.length > 0) {
                        const srv = client.servers.get(member._id.server);
                        if (srv?.roles) {
                            for (const role of member.roles) {
                                const c = srv.roles[role]?.colour;
                                if (c) {
                                    color = c;
                                    continue;
                                }
                            }
                        }
                    }
                }
            }
        }

        const el = (
            <Name {...otherProps} ref={innerRef} colour={color}>
                {prefixAt ? "@" : undefined}
                {masquerade?.name ?? username ?? (
                    <Text id="app.main.channel.unknown_user" />
                )}
            </Name>
        );

        if (user?.bot) {
            return (
                <>
                    {el}
                    <BotBadge>
                        {masquerade ? (
                            <Text id="app.main.channel.bridge" />
                        ) : (
                            <Text id="app.main.channel.bot" />
                        )}
                    </BotBadge>
                </>
            );
        }

        return el;
    },
);

export default function UserShort({
    user,
    size,
    prefixAt,
    masquerade,
    showServerIdentity,
}: {
    user?: User;
    size?: number;
    prefixAt?: boolean;
    masquerade?: API.Masquerade;
    showServerIdentity?: boolean;
}) {
    const openProfile = () =>
        user &&
        modalController.push({ type: "user_profile", user_id: user._id });

    const handleUserClick = (e: MouseEvent) => {
        if (e.shiftKey && user?._id) {
            e.preventDefault();
            internalEmit("MessageBox", "append", `<@${user?._id}>`, "mention");
        } else {
            openProfile();
        }
    };

    return (
        <>
            <UserIcon
                target={user}
                size={size ?? 24}
                masquerade={masquerade}
                onClick={handleUserClick}
                showServerIdentity={showServerIdentity}
            />
            <Username
                user={user}
                prefixAt={prefixAt}
                masquerade={masquerade}
                onClick={handleUserClick}
                showServerIdentity={showServerIdentity}
            />
        </>
    );
}
